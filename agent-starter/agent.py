"""The agent: validate a lead, then route it if it is valid."""

from typing import TypedDict

from langgraph.graph import END, StateGraph

from router import route_lead
from rules import validate_lead


class State(TypedDict):
    lead: dict
    valid: bool
    errors: list
    route: str


def validate_node(state):
    result = validate_lead(state["lead"])
    return {"valid": result["valid"], "errors": result["errors"]}


def route_node(state):
    return {"route": route_lead(state["lead"])}


graph = StateGraph(State)
graph.add_node("validate", validate_node)
graph.add_node("route", route_node)
graph.set_entry_point("validate")
graph.add_conditional_edges("validate", lambda s: s["valid"], {True: "route", False: END})
graph.add_edge("route", END)
app = graph.compile()
