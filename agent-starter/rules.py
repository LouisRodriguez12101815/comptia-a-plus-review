"""Lead validation rules. Pure Python, no third-party imports."""

REQUIRED = ["name", "email", "budget", "request"]


def validate_lead(lead):
    errors = []
    for field in REQUIRED:
        if not str(lead.get(field, "")).strip():
            errors.append(f"missing {field}")
    budget = lead.get("budget")
    if budget is not None and str(budget).strip():
        try:
            if float(budget) < 0:
                errors.append("budget must be nonnegative")
        except (TypeError, ValueError):
            errors.append("budget must be numeric")
    return {"valid": not errors, "errors": errors}
