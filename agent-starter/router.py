"""Routing rules for a valid lead. Pure Python, no third-party imports."""


def route_lead(lead):
    if float(lead["budget"]) >= 5000:
        return "sales"
    if "help" in str(lead["request"]).lower():
        return "support"
    return "nurture"
