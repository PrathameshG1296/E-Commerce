from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Any
from supabase import Client
from app.db import get_supabase_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

supabase: Client = get_supabase_admin()


class TrackEventRequest(BaseModel):
    event_type: str
    session_id: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


@router.post("/track", status_code=status.HTTP_201_CREATED)
async def track_event(body: TrackEventRequest):
    """Public endpoint to record analytics events (e.g. product views for trending)."""
    try:
        payload = {
            "event_type": body.event_type,
            "session_id": body.session_id,
            "metadata": body.metadata or {},
        }
        supabase.table("analytics_events").insert(payload).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track event: {str(e)}",
        )

from app.auth import CurrentUser, get_current_admin

@router.get("/dashboard")
async def get_admin_dashboard(current_admin: CurrentUser = Depends(get_current_admin)):
    """Admin endpoint to fetch key metrics: total revenue, order count, total users, recent sales."""
    try:
        # Get total users (we can query profiles table)
        profiles_res = supabase.table("profiles").select("id", count="exact").execute()
        total_users = profiles_res.count if hasattr(profiles_res, "count") and profiles_res.count is not None else 0
        if not total_users and isinstance(profiles_res.data, list):
            total_users = len(profiles_res.data) # Fallback if count="exact" fails

        # Get total orders and revenue
        orders_res = supabase.table("orders").select("total_amount, status").execute()
        orders = orders_res.data or []
        
        total_orders = len(orders)
        successful_orders = [o for o in orders if o.get("status") in ["paid", "shipped", "delivered"]]
        total_revenue = sum(o.get("total_amount", 0) for o in successful_orders)
        
        # Get total products
        products_res = supabase.table("products").select("id", count="exact").execute()
        total_products = products_res.count if hasattr(products_res, "count") and products_res.count is not None else 0
        if not total_products and isinstance(products_res.data, list):
            total_products = len(products_res.data)

        # Recent orders (last 5)
        recent_orders_res = (
            supabase.table("orders")
            .select("id, status, total_amount, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        return {
            "metrics": {
                "total_users": total_users,
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "total_products": total_products,
            },
            "recent_orders": recent_orders_res.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard metrics: {str(e)}",
        )
