"""Sanity checks on Pydantic schemas."""
import pytest
from pydantic import ValidationError

from app.core.schemas import AgentRequest, QueryRequest


def test_query_request_requires_non_empty_question():
    with pytest.raises(ValidationError):
        QueryRequest(question="")


def test_agent_request_requires_session_id():
    with pytest.raises(ValidationError):
        AgentRequest(message="hello")  # type: ignore[call-arg]


def test_agent_request_ok():
    req = AgentRequest(message="hi", session_id="abc")
    assert req.session_id == "abc"
