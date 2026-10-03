import json
from typing import Any, List, Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user, get_current_admin
from app.config import settings
from app.db import get_supabase_admin
from app.notifications import send_order_confirmation_email, send_order_status_update_email

router = APIRouter(prefix="/api/orders", tags=["Orders"])

supabase = get_supabase_admin()

PRODUCT_SELECT = "id, name, slug, price, image_url, stock"


class ShippingAddress(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    address_line1: str = Field(..., min_length=3)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    postal_code: str = Field(..., min_length=4)
    country: str = "India"


class CreateOrderRequest(BaseModel):
    shipping_address: ShippingAddress


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemResponse(BaseModel):
    id: str
    product_id: Optional[str] = None
    quantity: int
    price: float
    products: Optional[dict[str, Any]] = None


class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str
    total_amount: float
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    shipping_address: dict[str, Any]
    created_at: Optional[str] = None
    order_items: List[OrderItemResponse] = []


class CreateOrderResponse(BaseModel):
    order_id: str
    razorpay_order_id: str
    amount: int
    currency: str
    key_id: str


def _get_razorpay_client() -> razorpay.Client:
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env",
        )
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _fetch_user_cart(user_id: str) -> list[dict]:
    response = (
        supabase.table("cart_items")
        .select(f"*, products({PRODUCT_SELECT})")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data or []


def _order_with_items(order_id: str) -> dict:
    order_res = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not order_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    items_res = (
        supabase.table("order_items")
        .select(f"*, products({PRODUCT_SELECT})")
        .eq("order_id", order_id)
        .execute()
    )
    return {**order_res.data[0], "order_items": items_res.data or []}


@router.get("", response_model=List[OrderResponse])
async def list_orders(current_user: CurrentUser = Depends(get_current_user)):
    try:
        response = (
            supabase.table("orders")
            .select("*")
            .eq("user_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )
        orders = response.data or []
        result = []
        for order in orders:
            items_res = (
                supabase.table("order_items")
                .select(f"*, products({PRODUCT_SELECT})")
                .eq("order_id", order["id"])
                .execute()
            )
            result.append({**order, "order_items": items_res.data or []})
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}",
        )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: CurrentUser = Depends(get_current_user)):
    try:
        order = _order_with_items(order_id)
        if order.get("user_id") != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch order: {str(e)}",
        )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: str, current_user: CurrentUser = Depends(get_current_user)):
    try:
        order = _order_with_items(order_id)
        if order.get("user_id") != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        if order.get("status") in ["shipped", "delivered"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel an order that is already {order.get('status')}",
            )
        if order.get("status") == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is already cancelled",
            )

        # Update order status to cancelled
        supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()

        # Restock items
        for item in order.get("order_items", []):
            if item.get("product_id"):
                product_res = supabase.table("products").select("stock").eq("id", item["product_id"]).execute()
                if product_res.data:
                    current_stock = product_res.data[0].get("stock", 0)
                    supabase.table("products").update({"stock": current_stock + item.get("quantity", 1)}).eq("id", item["product_id"]).execute()

        return _order_with_items(order_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(e)}",
        )



@router.post("/create", response_model=CreateOrderResponse)
async def create_order(
    body: CreateOrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        cart_items = _fetch_user_cart(current_user.id)
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        total = 0.0
        line_items: list[dict] = []

        for item in cart_items:
            product = item.get("products")
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart contains an invalid product",
                )
            qty = item["quantity"]
            if product["stock"] < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {product['name']}",
                )
            line_total = float(product["price"]) * qty
            total += line_total
            line_items.append(
                {
                    "product_id": product["id"],
                    "quantity": qty,
                    "price": float(product["price"]),
                }
            )

        order_res = (
            supabase.table("orders")
            .insert(
                {
                    "user_id": current_user.id,
                    "status": "pending",
                    "total_amount": total,
                    "shipping_address": body.shipping_address.model_dump(),
                }
            )
            .execute()
        )
        if not order_res.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create order")

        order_id = order_res.data[0]["id"]
        order_items_payload = [{**li, "order_id": order_id} for li in line_items]
        supabase.table("order_items").insert(order_items_payload).execute()

        amount_paise = int(round(total * 100))
        if amount_paise < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order total must be at least ₹1",
            )

        razorpay_client = _get_razorpay_client()
        razorpay_order = razorpay_client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order_id[:8],
                "notes": {"order_id": order_id, "user_id": current_user.id},
            }
        )

        supabase.table("orders").update({"razorpay_order_id": razorpay_order["id"]}).eq(
            "id", order_id
        ).execute()

        return {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}",
        )


@router.post("/verify-payment")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        order_res = (
            supabase.table("orders")
            .select("*")
            .eq("id", body.order_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not order_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        order = order_res.data[0]
        if order.get("status") == "paid":
            return {"status": "ok", "message": "Order already paid", "order_id": body.order_id}

        if order.get("razorpay_order_id") != body.razorpay_order_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Razorpay order mismatch")

        razorpay_client = _get_razorpay_client()
        razorpay_client.utility.verify_payment_signature(
            {
                "razorpay_order_id": body.razorpay_order_id,
                "razorpay_payment_id": body.razorpay_payment_id,
                "razorpay_signature": body.razorpay_signature,
            }
        )

        items_res = (
            supabase.table("order_items")
            .select("product_id, quantity")
            .eq("order_id", body.order_id)
            .execute()
        )
        for item in items_res.data or []:
            if not item.get("product_id"):
                continue
            product_res = (
                supabase.table("products")
                .select("stock")
                .eq("id", item["product_id"])
                .execute()
            )
            if product_res.data:
                new_stock = max(0, product_res.data[0]["stock"] - item["quantity"])
                supabase.table("products").update({"stock": new_stock}).eq(
                    "id", item["product_id"]
                ).execute()

        supabase.table("orders").update(
            {
                "status": "paid",
                "razorpay_payment_id": body.razorpay_payment_id,
                "razorpay_signature": body.razorpay_signature,
            }
        ).eq("id", body.order_id).execute()

        supabase.table("cart_items").delete().eq("user_id", current_user.id).execute()

        return {"status": "ok", "message": "Payment verified", "order_id": body.order_id}
    except razorpay.errors.SignatureVerificationError:
        supabase.table("orders").update({"status": "failed"}).eq("id", body.order_id).execute()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}",
        )

def _get_user_email(user_id: str) -> str:
    try:
        user = supabase.auth.admin.get_user_by_id(user_id)
        return user.user.email
    except Exception:
        return f"customer_{user_id[:8]}@example.com"


@router.post("/webhook")
async def razorpay_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handles asynchronous payment events from Razorpay (like order.paid).
    """
    # Webhooks might be disabled in some environments or local dev without ngrok
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return {"status": "ignored", "message": "Webhook secret not configured"}

    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        # Verify the signature
        client = _get_razorpay_client()
        client.utility.verify_webhook_signature(
            raw_body.decode('utf-8'), 
            signature, 
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {str(e)}")

    try:
        payload = json.loads(raw_body)
        event = payload.get("event")

        # We care about successful payments
        if event in ["payment.captured", "order.paid"]:
            event_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            if event == "order.paid":
                event_entity = payload.get("payload", {}).get("order", {}).get("entity", {})

            razorpay_order_id = event_entity.get("order_id") or event_entity.get("id")
            
            if not razorpay_order_id:
                return {"status": "ok", "message": "No order_id in payload"}

            # Fetch our internal order using razorpay_order_id
            order_res = supabase.table("orders").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
            if not order_res.data:
                # Could be an order from another system sharing the same Razorpay account
                return {"status": "ok", "message": "Order not found in DB"}
            
            order = order_res.data[0]

            # Only process if it's currently pending
            if order.get("status") == "pending":
                # Update status
                supabase.table("orders").update({"status": "paid"}).eq("id", order["id"]).execute()
                
                # Send email notification
                user_email = _get_user_email(order.get("user_id"))
                background_tasks.add_task(
                    send_order_confirmation_email,
                    user_email=user_email,
                    order_id=order["id"],
                    total_amount=order.get("total_amount", 0)
                )

                # Process inventory (decrement stock)
                items_res = supabase.table("order_items").select("*").eq("order_id", order["id"]).execute()
                for item in items_res.data:
                    # Current stock check is ideal, but for simplicity we just decrement
                    # We might have race conditions here in a high traffic app, but this is standard
                    if item.get("product_id"):
                        product_res = supabase.table("products").select("stock").eq("id", item["product_id"]).execute()
                        if product_res.data:
                            current_stock = product_res.data[0].get("stock", 0)
                            new_stock = max(0, current_stock - item.get("quantity", 1))
                            supabase.table("products").update({"stock": new_stock}).eq("id", item["product_id"]).execute()
                
                # We could clear cart here, but we'd need the user_id from the order.
                # Actually, the user ID is in `order["user_id"]`.
                user_id = order.get("user_id")
                if user_id:
                    supabase.table("cart_items").delete().eq("user_id", user_id).execute()
        
        elif event in ["payment.failed"]:
             # Extract order ID and mark as failed if it's pending
             event_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
             razorpay_order_id = event_entity.get("order_id")
             if razorpay_order_id:
                 supabase.table("orders").update({"status": "failed"}).eq("razorpay_order_id", razorpay_order_id).execute()

        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook error: {e}")
        # Return 200 anyway so Razorpay doesn't keep retrying for non-critical code bugs here
        return {"status": "error", "message": str(e)}


# ── Admin: Update Order Status ─────────────────────────────────────────────────

ALLOWED_STATUSES = {"pending", "paid", "shipped", "delivered", "cancelled", "failed"}

# Terminal statuses: once reached, no further transitions allowed
TERMINAL_STATUSES = {"delivered", "cancelled", "failed"}


class UpdateOrderStatusRequest(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: str,
    body: UpdateOrderStatusRequest,
    background_tasks: BackgroundTasks,
    current_admin: CurrentUser = Depends(get_current_admin),
):
    """Admin-only: change an order's fulfillment status."""
    new_status = body.status.strip().lower()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(ALLOWED_STATUSES))}",
        )

    order_res = supabase.table("orders").select("status").eq("id", order_id).execute()
    if not order_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    current_status = order_res.data[0].get("status", "")

    if current_status == new_status:
        return _order_with_items(order_id)

    if current_status in TERMINAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already '{current_status}' and cannot be changed",
        )

    update_data = {"status": new_status}
    if body.tracking_number is not None:
        update_data["tracking_number"] = body.tracking_number.strip()
    if body.carrier is not None:
        update_data["carrier"] = body.carrier.strip()

    supabase.table("orders").update(update_data).eq("id", order_id).execute()

    user_id = order_res.data[0].get("user_id")
    if user_id:
        user_email = _get_user_email(user_id)
        background_tasks.add_task(
            send_order_status_update_email,
            user_email=user_email,
            order_id=order_id,
            new_status=new_status
        )

    return _order_with_items(order_id)
