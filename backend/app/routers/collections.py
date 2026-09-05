from collections import Counter
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from supabase import create_client, Client
from app.config import settings
from app.product_queries import run_product_query

router = APIRouter(prefix="/api/collections", tags=["Collections"])

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


class FlashSaleResponse(BaseModel):
    id: str
    title: str
    slug: str
    starts_at: str
    ends_at: str
    is_active: bool
    products: List[Any] = []


def _fetch_products_by_ids(product_ids: List[str]) -> List[dict]:
    if not product_ids:
        return []

    def build_query(select: str):
        return supabase.table("products").select(select).in_("id", product_ids).execute()

    response = run_product_query(supabase, build_query)
    by_id = {p["id"]: p for p in response.data}
    return [by_id[pid] for pid in product_ids if pid in by_id]


def _featured_fallback(limit: int) -> List[dict]:
    def build_query(select: str):
        return (
            supabase.table("products")
            .select(select)
            .eq("is_featured", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

    response = run_product_query(supabase, build_query)
    return response.data


@router.get("/flash-sale", response_model=FlashSaleResponse)
async def get_flash_sale():
    try:
        now = datetime.now(timezone.utc).isoformat()
        sale_res = (
            supabase.table("flash_sales")
            .select("*")
            .eq("is_active", True)
            .lte("starts_at", now)
            .gte("ends_at", now)
            .order("ends_at")
            .limit(1)
            .execute()
        )
        if not sale_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active flash sale")

        sale = sale_res.data[0]
        items_res = (
            supabase.table("flash_sale_products")
            .select("product_id, sale_price")
            .eq("flash_sale_id", sale["id"])
            .execute()
        )
        product_ids = [i["product_id"] for i in items_res.data]
        products = _fetch_products_by_ids(product_ids)

        sale_prices = {i["product_id"]: i.get("sale_price") for i in items_res.data}
        for product in products:
            sp = sale_prices.get(product["id"])
            if sp is not None:
                product["compare_at_price"] = product["price"]
                product["price"] = float(sp)

        return {**sale, "products": products}
    except HTTPException:
        raise
    except Exception as e:
        err = str(e).lower()
        if "flash_sales" in err or "flash_sale_products" in err:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active flash sale")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flash sale: {str(e)}",
        )


@router.get("/best-sellers")
async def get_best_sellers(limit: int = Query(12, ge=1, le=50)):
    try:
        orders_res = (
            supabase.table("orders")
            .select("id")
            .in_("status", ["paid", "shipped", "delivered"])
            .execute()
        )
        order_ids = [o["id"] for o in orders_res.data]

        if not order_ids:
            return _featured_fallback(limit)

        items_res = (
            supabase.table("order_items")
            .select("product_id, quantity")
            .in_("order_id", order_ids)
            .execute()
        )
        if not items_res.data:
            return _featured_fallback(limit)

        counts: Counter = Counter()
        for item in items_res.data:
            if item.get("product_id"):
                counts[item["product_id"]] += item.get("quantity", 1)

        top_ids = [pid for pid, _ in counts.most_common(limit)]
        return _fetch_products_by_ids(top_ids)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch best sellers: {str(e)}",
        )


@router.get("/trending")
async def get_trending(limit: int = Query(12, ge=1, le=50)):
    try:
        events_res = (
            supabase.table("analytics_events")
            .select("metadata")
            .eq("event_type", "product_view")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )

        counts: Counter = Counter()
        for event in events_res.data:
            meta = event.get("metadata") or {}
            pid = meta.get("product_id")
            if pid:
                counts[pid] += 1

        if not counts:
            return _featured_fallback(limit)

        top_ids = [pid for pid, _ in counts.most_common(limit)]
        return _fetch_products_by_ids(top_ids)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trending products: {str(e)}",
        )
