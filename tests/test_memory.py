"""Memory store tests."""
from langchain_core.messages import AIMessage, HumanMessage

from app.agent.memory import MemoryStore


def test_append_and_get():
    m = MemoryStore(window=3)
    m.append("s1", HumanMessage(content="hi"))
    m.append("s1", AIMessage(content="hello"))
    msgs = m.get("s1")
    assert len(msgs) == 2
    assert msgs[0].content == "hi"


def test_window_eviction():
    m = MemoryStore(window=2)  # max 4 raw messages
    for i in range(10):
        m.append("s1", HumanMessage(content=str(i)))
    msgs = m.get("s1")
    assert len(msgs) == 4
    assert msgs[0].content == "6"


def test_clear():
    m = MemoryStore(window=2)
    m.append("s1", HumanMessage(content="hi"))
    m.clear("s1")
    assert m.get("s1") == []


def test_isolation_between_sessions():
    m = MemoryStore(window=5)
    m.append("a", HumanMessage(content="a-msg"))
    m.append("b", HumanMessage(content="b-msg"))
    assert len(m.get("a")) == 1
    assert m.get("a")[0].content == "a-msg"
    assert m.get("b")[0].content == "b-msg"
