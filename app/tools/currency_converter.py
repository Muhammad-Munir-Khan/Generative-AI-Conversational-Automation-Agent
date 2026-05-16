"""Tool: currency conversion via the free Frankfurter API."""
from functools import lru_cache

import requests
from langchain_core.tools import tool

API_BASE = "https://api.frankfurter.app"


@lru_cache(maxsize=1)
def _supported_currencies() -> set[str]:
    try:
        r = requests.get(f"{API_BASE}/currencies", timeout=5)
        r.raise_for_status()
        return set(r.json().keys())
    except requests.RequestException:
        return {
            "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD",
            "INR", "NZD", "SGD", "ZAR", "BRL", "RUB", "MXN", "KRW", "TRY",
        }


@tool
def currency_converter(
    amount: float | int | str,
    from_currency: str,
    to_currency: str,
) -> str:
    """Convert an amount from one currency to another using current ECB rates.

    Supports ~30 major currencies (USD, EUR, GBP, JPY, INR, etc.).
    Rates update once per business day.

    Args:
        amount: The numeric amount to convert. Accepted as a number OR a
            string of digits (some LLMs occasionally quote numeric arguments).
        from_currency: 3-letter currency code (e.g. "USD").
        to_currency: 3-letter currency code (e.g. "EUR").

    Returns:
        A formatted result like "100 USD = 92.35 EUR (rate: 0.9235)".
    """
    # Defensive coercion: smaller LLMs (e.g. gpt-oss-20b) sometimes serialize
    # numeric tool arguments as strings ("2100000" instead of 2100000), which
    # Groq's strict schema validation rejects. We declare the parameter as
    # `float | int | str` so the schema accepts both, then coerce here.
    if isinstance(amount, str):
        # Strip thousands separators and whitespace the LLM might have added.
        cleaned = amount.replace(",", "").replace("_", "").strip()
        try:
            amount = float(cleaned)
        except ValueError:
            return f"Error: amount {amount!r} is not a valid number."
    elif not isinstance(amount, (int, float)):
        return f"Error: amount must be a number, got {type(amount).__name__}."

    amount = float(amount)

    src = from_currency.upper().strip()
    dst = to_currency.upper().strip()

    if src == dst:
        return f"{amount} {src} = {amount} {dst} (same currency)"

    supported = _supported_currencies()
    missing = [c for c in (src, dst) if c not in supported]
    if missing:
        return (
            f"Error: currency {missing[0]!r} not supported. "
            f"Supported: {', '.join(sorted(supported))}"
        )

    try:
        r = requests.get(
            f"{API_BASE}/latest",
            params={"amount": amount, "from": src, "to": dst},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        result = data["rates"][dst]
        rate = result / amount if amount else 0
        rate_date = data.get("date", "today")
        return (
            f"{amount} {src} = {result:,.2f} {dst} "
            f"(rate: {rate:.4f}, as of {rate_date})"
        )
    except requests.RequestException as e:
        return f"Error: currency API unavailable: {e}"
    except KeyError:
        return f"Error: unexpected API response format"