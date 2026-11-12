# AWS source-register duplicate-key repair

Base: `origin/main` at `852a87e72878cd35a1c603aae9aab962ed378d3e`.
Branch: `fix/aws-source-register-duplicates`.

The separate professor-50 audit remains at `bcd896679e2233af46a7324b163ca7e9ee18cbae` on `audit/aws-clf-professor-50`. That branch was pushed unchanged before this repair. No audit PR, cherry-pick, merge or audit-document edit is part of the repair.

## Defect and root cause

A duplicate-preserving scan of the complete JSON found two top-level `sources` properties. The earlier map had 163 source occurrences; the later map had 32. Ordinary JSON parsing silently retained only the later map. The earlier map also repeated `athena`, `glue`, `tags` and `redshift`; combining both maps exposed additional collisions for `ecs`, `eks` and `lambda`. No other duplicate object keys were found at any depth. These were accumulated source-map additions without duplicate-key validation; syntactically valid JSON concealed the lost provenance.

The repair combines the maps, preserves all established keys, consolidates identical references with their useful metadata, and adds descriptive keys for different URLs. It does not change source dates, scope, findings, objective mappings or teaching content. No live URL/freshness verification is claimed or required for this structural repair.

## Old and new mappings

| Old key / occurrences | Relationship | Retained mapping |
| --- | --- | --- |
| `ecs`, earlier developer guide and later product page | Complementary documentation | `ecs` keeps [product page](https://aws.amazon.com/ecs/), title “Amazon Elastic Container Service”. Earlier [developer guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) becomes `ecsDeveloperGuide`, retaining “What is Amazon Elastic Container Service? - Amazon Elastic Container Service”. |
| `eks`, earlier user guide and later product page | Complementary documentation | `eks` keeps [product page](https://aws.amazon.com/eks/), title “Amazon Elastic Kubernetes Service”. Earlier [user guide](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html) becomes `eksUserGuide`, retaining “What is Amazon EKS? - Amazon EKS”. |
| `lambda`, same URL in both maps | Same reference, different labels | One `lambda`: [developer guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html), retaining the previously effective title “AWS Lambda Developer Guide”. Earlier title: “What is AWS Lambda? - AWS Lambda”. |
| `athena`, twice in earlier map | Same reference, later occurrence adds metadata | One `athena`: [Athena guide](https://docs.aws.amazon.com/athena/latest/ug/what-is.html), retaining “What is Amazon Athena?” and `type: service-behavior`. Earlier title: “What is Amazon Athena? - Amazon Athena”. |
| `glue`, twice in earlier map | Same reference, later occurrence adds metadata | One `glue`: [Glue guide](https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html), retaining “What is AWS Glue?” and `type: service-behavior`. Earlier title: “What is AWS Glue? - AWS Glue”. |
| `redshift`, twice in earlier map | Same reference, different labels and metadata | One `redshift`: [Redshift guide](https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html), retaining later title “Redshift overview” plus earlier `type: service-behavior`. Earlier title: “What is Amazon Redshift?”. |
| `tags`, earlier normal path and later `/us_en/` path | Same documentation topic with different existing paths; redirect equivalence not assumed | `tags` retains the later [localized path](https://docs.aws.amazon.com/us_en/awsaccountbilling/latest/aboutv2/activating-tags.html). Earlier [normal path](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/activating-tags.html) becomes `tagsActivationGuide`. Both retain the existing title “Activating user-defined cost allocation tags”. |

All URLs and retained titles above already existed in the register. Removed alternate labels are recorded here; no reference URL or `service-behavior` metadata was lost. No source-ID consumer needs an update because every established key remains available. Existing finding `sourceIds` are unchanged and now all resolve against the combined map. Unrelated source IDs that happen to share a URL remain untouched.

## Regression guard

[scripts/lib/aws-source-register.mjs](../scripts/lib/aws-source-register.mjs) walks JSON tokens and object boundaries before whole-document parsing. Each object gets its own key set, and string-key decoding catches equivalent escaped names such as `ecs` and `\u0065cs`. It detects duplicates at every nesting level, including objects inside arrays, while allowing the same key in separate objects. The existing [content checker](../scripts/check-content.mjs) invokes it for this register, then checks local schema and finding references. No dependency was added.

[Content regression tests](../tests/content-check.test.mjs) cover root/source/metadata/array duplicates, escaped keys, valid sibling objects and escaped strings, malformed JSON, invalid source metadata and unresolved references. A seeded duplicate top-level map must make the actual content-check command fail, so the guard cannot pass merely by testing a helper in isolation.

## Validation

- Duplicate-preserving before/after comparison: **195 original source occurrences → 191 unique source entries**; all **188 original distinct keys** remain, plus `ecsDeveloperGuide`, `eksUserGuide` and `tagsActivationGuide`.
- All **187 distinct original URLs** remain; no URL was introduced. The **32 formerly effective source objects are unchanged** under their existing IDs.
- Non-source top-level values, source-ID references and source dates match the base exactly. All 49 finding references resolve to 40 distinct source IDs. Every original occurrence maps to an entry retaining its URL and metadata; alternate labels are documented above.
- Duplicate-key validation and normal JSON parsing pass. Local schema validation and every finding's source-reference integrity pass.
- `npm run check:content`: 0 errors, 207 existing warnings.
- `npm run test:content`: 8 passed, including guard regressions and the seeded command failure.
- `npm run test:exam`: 44 passed. `npm run test:objectives`: 13 passed. Total with content tests: 65 passed, 0 failed.
- Targeted JavaScript syntax/lint checks and `git diff --check`: pass.

Only the register, its validation helper/checker, regression tests and this repair note change. No questions, flashcards, topics, labs, drills, visuals, learner APIs, UI, PDFs, Vercel configuration or credentials change. No deployment or merge is part of this repair.
