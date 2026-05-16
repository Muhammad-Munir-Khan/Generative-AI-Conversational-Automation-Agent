"""Unit tests for the calculator tool."""
from app.tools.calculator import calculator


def test_basic_arithmetic():
    assert calculator.invoke({"expression": "2 + 2"}) == "4"
    assert calculator.invoke({"expression": "10 - 3"}) == "7"
    assert calculator.invoke({"expression": "6 * 7"}) == "42"
    assert calculator.invoke({"expression": "20 / 4"}) == "5.0"


def test_precedence_and_parens():
    assert calculator.invoke({"expression": "2 + 3 * 4"}) == "14"
    assert calculator.invoke({"expression": "(2 + 3) * 4"}) == "20"


def test_unary_minus():
    assert calculator.invoke({"expression": "-5 + 10"}) == "5"


def test_pow():
    assert calculator.invoke({"expression": "2 ** 10"}) == "1024"


def test_zero_division_safe():
    assert "division by zero" in calculator.invoke({"expression": "1 / 0"}).lower()


def test_rejects_function_calls():
    out = calculator.invoke({"expression": "__import__('os').system('ls')"})
    assert out.startswith("Error:")


def test_rejects_names():
    out = calculator.invoke({"expression": "x + 1"})
    assert out.startswith("Error:")
