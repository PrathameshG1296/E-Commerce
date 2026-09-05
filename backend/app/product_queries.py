from typing import Callable, TypeVar

from supabase import Client

PRODUCT_SELECT_BASE = "*, categories(id, name, slug)"
PRODUCT_SELECT_FULL = "*, categories(id, name, slug), brands(id, name, slug)"

_brands_join_available: bool | None = None

T = TypeVar("T")


def _brands_schema_missing(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "brands" in msg and ("relationship" in msg or "pgrst200" in msg or "foreign key" in msg)


def product_select() -> str:
    if _brands_join_available is False:
        return PRODUCT_SELECT_BASE
    return PRODUCT_SELECT_FULL


def run_product_query(supabase: Client, build: Callable[[str], T]) -> T:
    """Execute a products query; auto-fallback if Phase 3 brands schema is missing."""
    global _brands_join_available

    if _brands_join_available is False:
        return build(PRODUCT_SELECT_BASE)

    try:
        result = build(PRODUCT_SELECT_FULL)
        _brands_join_available = True
        return result
    except Exception as exc:
        if _brands_schema_missing(exc):
            _brands_join_available = False
            return build(PRODUCT_SELECT_BASE)
        raise
