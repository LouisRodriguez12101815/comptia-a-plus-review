"""Run the agent on three sample leads. Expected output is in README.md."""

from agent import app

LEADS = {
    "A": {"name": "Ana", "email": "ana@shop.com", "budget": 8000, "request": "quote"},
    "B": {"name": "Bo", "email": "", "budget": 300, "request": "help"},
    "C": {"name": "Cy", "email": "cy@cafe.com", "budget": 900, "request": "help with setup"},
}

for label, lead in LEADS.items():
    final = app.invoke({"lead": lead, "valid": False, "errors": [], "route": ""})
    if final["valid"]:
        print(f"Lead {label}: valid; {final['route']}")
    else:
        print(f"Lead {label}: invalid; {', '.join(final['errors'])}")
