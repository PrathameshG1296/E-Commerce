from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from app.auth import get_current_admin, CurrentUser
from supabase import create_client, Client
from app.config import settings

router = APIRouter(prefix="/api/products", tags=["Products"])

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

class ProductCreate(BaseModel):
    category_id: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    price: float = Field(..., gte=0)
    compare_at_price: Optional[float] = None
    image_url: Optional[str] = None
    images: List[str] = []
    stock: int = Field(0, gte=0)
    is_featured: bool = False

class CategoryNestedResponse(BaseModel):
    id: str
    name: str
    slug: str

class BrandNestedResponse(BaseModel):
    id: str
    name: str
    slug: str

class ProductResponse(BaseModel):
    id: str
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    image_url: Optional[str] = None
    images: List[str] = []
    stock: int
    is_featured: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    categories: Optional[CategoryNestedResponse] = None
    brands: Optional[BrandNestedResponse] = None

from app.product_queries import run_product_query

@router.get("")
async def list_products(
    category_id: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    is_featured: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"), # newest, price_asc, price_desc
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Lists products with comprehensive search, filters, sorting, and pagination.
    """
    try:
        def build_query(select: str):
            query_builder = supabase.table("products").select(select)

            if category_id:
                query_builder = query_builder.eq("category_id", category_id)
            if brand_id:
                query_builder = query_builder.eq("brand_id", brand_id)
            if is_featured is not None:
                query_builder = query_builder.eq("is_featured", is_featured)
            if min_price is not None:
                query_builder = query_builder.gte("price", min_price)
            if max_price is not None:
                query_builder = query_builder.lte("price", max_price)
            if search:
                query_builder = query_builder.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")

            if sort_by == "price_asc":
                query_builder = query_builder.order("price", desc=False)
            elif sort_by == "price_desc":
                query_builder = query_builder.order("price", desc=True)
            else:
                query_builder = query_builder.order("created_at", desc=True)

            query_builder = query_builder.range(offset, offset + limit - 1)
            return query_builder.execute()

        response = run_product_query(supabase, build_query)
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )

@router.get("/{id_or_slug}", response_model=ProductResponse)
async def get_product(id_or_slug: str):
    """
    Retrieves a single product by either its UUID or unique slug.
    """
    try:
        # Check if argument is UUID-like, else search by slug
        is_uuid = len(id_or_slug) == 36 and id_or_slug.count("-") == 4

        def build_query(select: str):
            query_builder = supabase.table("products").select(select)
            if is_uuid:
                return query_builder.eq("id", id_or_slug).execute()
            return query_builder.eq("slug", id_or_slug).execute()

        response = run_product_query(supabase, build_query)
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to add a new product.
    """
    try:
        response = supabase.table("products").insert(product.model_dump()).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product creation failed"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

@router.put("/{id}", response_model=ProductResponse)
async def update_product(
    id: str,
    product: ProductCreate,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to update an existing product.
    """
    try:
        response = supabase.table("products").update(product.model_dump()).eq("id", id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or update failed"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update failed: {str(e)}"
        )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_product(
    id: str,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to delete a product.
    """
    try:
        response = supabase.table("products").delete().eq("id", id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or delete failed"
            )
        return {"status": "success", "message": f"Product {id} deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database deletion failed: {str(e)}"
        )
