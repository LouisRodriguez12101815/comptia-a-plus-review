import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from rubric_audit_openai.provider import OpenAIGrader, PROMPT, SCHEMA


def job():
    return {
        "job_id": "job-1", "request_hash": "hash-1", "phase": "recheck", "attempt": 2,
        "items": [{"item_id": "1.1.01", "objective": "1.1", "objective_title": "Explain backups",
                   "path": "Backups > Incremental", "item_text": "Incremental",
                   "previous_notes_grade": "taught", "previous_reason": "DO NOT SEND"}],
        "evidence": [{"evidence_id": "note:backups/types", "source_type": "note",
                      "source_path": "content/topics.json", "locator": "/0/sections/0",
                      "text": "An incremental backup copies changes since the previous backup.",
                      "legacy_score": "DO NOT SEND"}],
        "claude_judgments": ["DO NOT SEND"], "previous_response": "DO NOT SEND",
    }


def answer():
    citation = {"evidence_id": "note:backups/types", "quote": "copies changes since the previous backup"}
    return {"judgments": [{
        "item_id": "1.1.01", "notes_grade": "taught", "material_grade": "taught",
        "notes_citations": [citation], "material_citations": [citation],
        "notes_reason": "The backup note explains which changes an incremental backup copies.",
        "material_reason": "The same note supplies the incremental backup definition.",
        "retrieval_uncertain": False,
    }]}


def response(**overrides):
    values = {
        "id": "resp_example", "model": "chosen-model-snapshot", "status": "completed",
        "output": [], "output_text": json.dumps(answer()),
        "usage": SimpleNamespace(input_tokens=100, output_tokens=80, total_tokens=180,
                                 input_tokens_details=SimpleNamespace(cached_tokens=10),
                                 output_tokens_details=SimpleNamespace(reasoning_tokens=20),
                                 secret="DO NOT COPY"),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class FakeClient:
    def __init__(self, result=None, failure=None):
        self.result = result if result is not None else response()
        self.failure = failure
        self.requests = []
        self.responses = self

    def create(self, **kwargs):
        self.requests.append(kwargs)
        if self.failure:
            raise self.failure
        return self.result


class ProviderTests(unittest.TestCase):
    def test_structured_request_is_blinded_and_preserves_identity(self):
        client = FakeClient()
        result = OpenAIGrader("chosen-model", client=client)(job())
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["job_id"], "job-1")
        self.assertEqual(result["request_hash"], "hash-1")
        self.assertEqual(result["judgments"], answer()["judgments"])
        request = client.requests[0]
        self.assertEqual(request["model"], "chosen-model")
        self.assertIs(request["store"], False)
        self.assertEqual(request["text"]["format"]["schema"], SCHEMA)
        self.assertIs(request["text"]["format"]["strict"], True)
        self.assertEqual(request["input"][0]["content"], PROMPT)
        payload = json.loads(request["input"][1]["content"])
        self.assertEqual(set(payload), {"items", "evidence"})
        self.assertNotIn("DO NOT SEND", request["input"][1]["content"])
        self.assertNotIn("tools", request)
        self.assertEqual(result["returned_model"], "chosen-model-snapshot")
        self.assertEqual(result["usage"]["input_tokens_details"], {"cached_tokens": 10})
        self.assertNotIn("secret", result["usage"])

    def test_schema_objects_are_strict_and_require_all_properties(self):
        def check(node):
            if not isinstance(node, dict):
                return
            if node.get("type") == "object":
                self.assertIs(node["additionalProperties"], False)
                self.assertEqual(set(node["required"]), set(node["properties"]))
            for value in node.values():
                if isinstance(value, dict):
                    check(value)
                elif isinstance(value, list):
                    for member in value:
                        check(member)
        check(SCHEMA)

    def test_refusal_takes_precedence_over_valid_json(self):
        output = [{"type": "message", "content": [{"type": "refusal", "refusal": "PRIVATE REFUSAL"}]}]
        result = OpenAIGrader("chosen-model", client=FakeClient(response(output=output)))(job())
        self.assertEqual(result["status"], "error")
        self.assertIn("refused", result["error"])
        self.assertNotIn("judgments", result)
        self.assertNotIn("PRIVATE REFUSAL", json.dumps(result))

    def test_incomplete_takes_precedence_over_valid_json(self):
        result = OpenAIGrader("chosen-model", client=FakeClient(response(status="incomplete")))(job())
        self.assertEqual(result["status"], "error")
        self.assertIn("incomplete", result["error"])
        self.assertNotIn("judgments", result)

    def test_queued_or_failed_response_is_not_a_grade(self):
        for status in ("queued", "failed", "cancelled", "in_progress", None):
            with self.subTest(status=status):
                result = OpenAIGrader("chosen-model", client=FakeClient(response(status=status)))(job())
                self.assertEqual(result["status"], "error")
                self.assertNotIn("judgments", result)

    def test_invalid_json_and_duplicate_keys_are_rejected(self):
        for text in ("{", '{"judgments": [], "judgments": []}', '{"judgments": [NaN]}'):
            with self.subTest(text=text):
                result = OpenAIGrader("chosen-model", client=FakeClient(response(output_text=text)))(job())
                self.assertEqual(result["error"], "OpenAI returned invalid JSON.")
                self.assertEqual(result["request_hash"], "hash-1")

    def test_wrong_batch_shapes_and_missing_text_are_rejected(self):
        for text in ("[]", '{"judgments": "bad"}', '{"judgments": [], "extra": 1}', '{"judgments": [1]}', ""):
            with self.subTest(text=text):
                result = OpenAIGrader("chosen-model", client=FakeClient(response(output_text=text)))(job())
                self.assertEqual(result["status"], "error")
                self.assertNotIn("judgments", result)

    def test_api_errors_never_copy_exception_text_or_manufacture_absence(self):
        client = FakeClient(failure=RuntimeError("sk-do-not-expose supplied notes PRIVATE"))
        result = OpenAIGrader("chosen-model", client=client)(job())
        self.assertEqual(result["status"], "error")
        self.assertNotIn("sk-do-not-expose", json.dumps(result))
        self.assertNotIn("PRIVATE", json.dumps(result))
        self.assertNotIn("judgments", result)
        self.assertEqual(len(client.requests), 1)

    def test_optional_reasoning_and_token_limit_are_explicit(self):
        client = FakeClient()
        OpenAIGrader("chosen-model", client=client, max_output_tokens=1234,
                     reasoning_effort="medium")(job())
        self.assertEqual(client.requests[0]["reasoning"], {"effort": "medium"})
        self.assertEqual(client.requests[0]["max_output_tokens"], 1234)

    def test_invalid_job_never_calls_provider(self):
        client = FakeClient()
        invalid = job()
        invalid["items"] = []
        result = OpenAIGrader("chosen-model", client=client)(invalid)
        self.assertEqual(result["status"], "error")
        self.assertEqual(client.requests, [])

    def test_model_and_live_key_are_required(self):
        with self.assertRaises(ValueError):
            OpenAIGrader(" ", client=FakeClient())
        with self.assertRaises(ValueError):
            OpenAIGrader("chosen-model", client=FakeClient(), max_output_tokens=0)
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, "OPENAI_API_KEY"):
                OpenAIGrader("chosen-model")


if __name__ == "__main__":
    unittest.main()
