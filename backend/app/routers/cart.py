from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db import get_supabase_admin
from app.auth import get_current_user, CurrentUser

router = APIRouter(prefix="/api/cart", tags=["Cart"])

supabase = get_supabase_admin()

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class ProductNested(BaseModel):
    id: str
    name: str
    slug: str
    price: float
    image_url: Optional[str] = None
    stock: int

class CartItemResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    quantity: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    products: Optional[ProductNested] = None

@router.get("", response_model=List[CartItemResponse])
async def list_cart_items(current_user: CurrentUser = Depends(get_current_user)):
    """
    Retrieves all cart items for the authenticated user, nesting product details.
    """
    try:
        response = supabase.table("cart_items")\
            .select("*, products(id, name, slug, price, image_url, stock)")\
            .eq("user_id", current_user.id)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cart: {str(e)}"
        )

@router.post("", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item: CartItemAdd,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Adds a product to the user's cart. If the product already exists, increments the quantity.
    """
    try:
        # Check if item already exists in user's cart
        existing = supabase.table("cart_items")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .eq("product_id", item.product_id)\
            .execute()
        
        if existing.data:
            # Increment quantity
            new_qty = existing.data[0]["quantity"] + item.quantity
            response = supabase.table("cart_items")\
                .update({"quantity": new_qty})\
                .eq("id", existing.data[0]["id"])\
                .execute()
        else:
            # Create new cart item
            payload = {
                "user_id": current_user.id,
                "product_id": item.product_id,
                "quantity": item.quantity
            }
            response = supabase.table("cart_items").insert(payload).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to insert or update cart item"
            )
            
        # Re-query to return with nested product details
        full_item = supabase.table("cart_items")\
            .select("*, products(id, name, slug, price, image_url, stock)")\
            .eq("id", response.data[0]["id"])\
            .execute()
            
        return full_item.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cart operation failed: {str(e)}"
        )

@router.put("/{cart_item_id}", response_model=CartItemResponse)
async def update_cart_item(
    cart_item_id: str,
    item_update: CartItemUpdate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Updates the quantity of a specific item in the user's cart.
    """
    try:
        response = supabase.table("cart_items")\
            .update({"quantity": item_update.quantity})\
            .eq("id", cart_item_id)\
            .eq("user_id", current_user.id)\
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found or unauthorized update"
            )
            
        full_item = supabase.table("cart_items")\
            .select("*, products(id, name, slug, price, image_url, stock)")\
            .eq("id", response.data[0]["id"])\
            .execute()
            
        return full_item.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update cart item: {str(e)}"
        )

@router.delete("/{cart_item_id}", status_code=status.HTTP_200_OK)
async def delete_cart_item(
    cart_item_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Deletes a specific item from the user's cart.
    """
    try:
        response = supabase.table("cart_items")\
            .delete()\
            .eq("id", cart_item_id)\
            .eq("user_id", current_user.id)\
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found or unauthorized deletion"
            )
        return {"status": "success", "message": "Item removed from cart"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete cart item: {str(e)}"
        )

@router.delete("", status_code=status.HTTP_200_OK)
async def clear_cart(current_user: CurrentUser = Depends(get_current_user)):
    """
    Clears the entire shopping cart for the authenticated user.
    """
    try:
        supabase.table("cart_items")\
            .delete()\
            .eq("user_id", current_user.id)\
            .execute()
        return {"status": "success", "message": "Cart cleared successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cart: {str(e)}"
        )
