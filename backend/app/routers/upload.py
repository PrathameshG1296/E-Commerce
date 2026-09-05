"""
Admin-only endpoints for bulk CSV/XLSX upload of products and discount schedules.
"""

import csv
import io
import re
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from supabase import Client

from app.auth import get_current_admin, CurrentUser
from app.db import get_supabase_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Upload"])

supabase: Client = get_supabase_admin()


# ---------- Response Models ----------

class UploadSummary(BaseModel):
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = []


class DiscountRecord(BaseModel):
    id: str
    product_id: str
    sku: Optional[str] = None
    product_name: Optional[str] = None
    discount_rate: float
    starts_at: str
    ends_at: str
    is_active: bool
    original_price: Optional[float] = None
    created_at: Optional[str] = None
    status: Optional[str] = None  # active, upcoming, expired


# ---------- Helpers ----------

def _slugify(name: str) -> str:
    """Generate a URL-friendly slug from a product name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def _parse_uploaded_file(file_bytes: bytes, filename: str) -> List[dict]:
    """
    Parse a CSV or XLSX file into a list of dicts (one per row).
    Column headers become dict keys (lowercased, stripped).
    """
    rows: List[dict] = []

    if filename.lower().endswith((".xlsx", ".xls")):
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        ws = wb.active
        if ws is None:
            return rows

        headers: List[str] = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                headers = [str(cell).strip().lower() if cell else "" for cell in row]
                continue
            # Skip entirely empty rows
            values = list(row)
            if all(v is None for v in values):
                continue
            row_dict = {}
            for j, header in enumerate(headers):
                if header and j < len(values):
                    row_dict[header] = values[j]
            if row_dict:
                rows.append(row_dict)
        wb.close()

    elif filename.lower().endswith(".csv"):
        text = file_bytes.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            cleaned = {k.strip().lower(): v.strip() if v else None for k, v in row.items() if k}
            if any(v for v in cleaned.values()):
                rows.append(cleaned)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .csv or .xlsx file.",
        )

    return rows


def _safe_float(value, default=None) -> Optional[float]:
    """Safely parse a value to float."""
    if value is None:
        return default
    try:
        cleaned = str(value).replace(",", "").replace("₹", "").replace("$", "").strip()
        if cleaned == "" or cleaned.lower() in ("na", "n/a", "-", "none"):
            return default
        return float(cleaned)
    except (ValueError, TypeError):
        return default


def _safe_int(value, default=0) -> int:
    """Safely parse a value to int."""
    if value is None:
        return default
    try:
        cleaned = str(value).replace(",", "").strip()
        if cleaned == "" or cleaned.lower() in ("na", "n/a", "-", "none"):
            return default
        return int(float(cleaned))
    except (ValueError, TypeError):
        return default


def _safe_str(value) -> Optional[str]:
    """Safely convert to trimmed string or None."""
    if value is None:
        return None
    s = str(value).strip()
    return s if s and s.lower() not in ("none", "na", "n/a") else None


# ---------- Product Bulk Upload ----------

# Mapping from Excel template column names to our internal field names
PRODUCT_COLUMN_MAP = {
    "sku": "sku",
    "product name": "name",
    "product id": "external_id",
    "category": "category_name",
    "sub category": "sub_category",
    "brand": "brand_name",
    "product type": "product_type",
    "short description": "short_description",
    "product description": "description",
    "key features": "key_features",
    "specifications": "specifications",
    "mrp": "compare_at_price",
    "selling price": "price",
    "discount rate": "discount_rate",
    "stock quantity": "stock",
    "stock status": "stock_status",
    "size": "size",
    "colour": "colour",
    "color": "colour",
    "variant": "variant",
    "weight": "weight",
    "unit": "unit",
    "length": "length",
    "width": "width",
    "height": "height",
    "material": "material",
    "gst rate": "gst_rate",
    "hsn code": "hsn_code",
    "shipping type": "shipping_type",
    "shipping charge": "shipping_charge",
    "estimated delivery": "estimated_delivery",
    "return available": "return_available",
    "replacement available": "replacement_available",
    "return period": "return_period",
    "main image url": "image_url",
    "image 2 url": "image_2",
    "image 3 url": "image_3",
    "image 4 url": "image_4",
    "image 5 url": "image_5",
    "video url": "video_url",
    "product status": "product_status",
    "seo title": "seo_title",
    "seo description": "seo_description",
    "seo keywords": "seo_keywords",
    "tags": "tags",
}


def _map_row_to_product(row: dict) -> dict:
    """
    Map a raw Excel/CSV row to a normalized product dict
    using the column mapping.
    """
    mapped = {}
    for raw_key, value in row.items():
        normalized_key = raw_key.strip().lower()
        internal_key = PRODUCT_COLUMN_MAP.get(normalized_key)
        if internal_key:
            mapped[internal_key] = value
    return mapped


def _resolve_category_id(name: Optional[str]) -> Optional[str]:
    """Look up or create a category by name, return its ID."""
    if not name:
        return None
    name = name.strip()
    # Try to find existing
    res = supabase.table("categories").select("id").eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    # Create new category
    slug = _slugify(name)
    try:
        create_res = supabase.table("categories").insert({
            "name": name,
            "slug": slug,
            "description": None,
        }).execute()
        if create_res.data:
            return create_res.data[0]["id"]
    except Exception:
        # Slug conflict — try with suffix
        try:
            create_res = supabase.table("categories").insert({
                "name": name,
                "slug": f"{slug}-{name[:3].lower()}",
                "description": None,
            }).execute()
            if create_res.data:
                return create_res.data[0]["id"]
        except Exception:
            pass
    return None


def _resolve_brand_id(name: Optional[str]) -> Optional[str]:
    """Look up or create a brand by name, return its ID."""
    if not name:
        return None
    name = name.strip()
    res = supabase.table("brands").select("id").eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    slug = _slugify(name)
    try:
        create_res = supabase.table("brands").insert({
            "name": name,
            "slug": slug,
        }).execute()
        if create_res.data:
            return create_res.data[0]["id"]
    except Exception:
        pass
    return None


@router.post("/upload/products", response_model=UploadSummary)
async def upload_products(
    file: UploadFile = File(...),
    _admin: CurrentUser = Depends(get_current_admin),
):
    """
    Bulk upload products from a CSV or XLSX file.
    Matches the Product Listing Template format.
    Upserts by SKU — if SKU exists, updates; otherwise inserts.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    rows = _parse_uploaded_file(content, file.filename)

    if not rows:
        raise HTTPException(status_code=400, detail="File is empty or could not be parsed")

    summary = UploadSummary()

    for idx, raw_row in enumerate(rows, start=2):  # start=2 because row 1 is header
        try:
            mapped = _map_row_to_product(raw_row)

            name = _safe_str(mapped.get("name"))
            if not name:
                # Skip rows without a product name
                summary.skipped += 1
                continue

            sku = _safe_str(mapped.get("sku"))
            price = _safe_float(mapped.get("price"))
            compare_at_price = _safe_float(mapped.get("compare_at_price"))

            if price is None and compare_at_price is not None:
                # If only MRP is given, use it as price
                price = compare_at_price
                compare_at_price = None

            if price is None:
                summary.errors.append(f"Row {idx}: '{name}' — missing price, skipped")
                summary.skipped += 1
                continue

            # Build images array from extra image URLs
            images = []
            for img_key in ("image_2", "image_3", "image_4", "image_5"):
                img_val = _safe_str(mapped.get(img_key))
                if img_val:
                    images.append(img_val)

            slug = _slugify(name)

            # Resolve category and brand
            category_id = _resolve_category_id(_safe_str(mapped.get("category_name")))
            brand_id = _resolve_brand_id(_safe_str(mapped.get("brand_name")))

            # Build description from available fields
            desc_parts = []
            for desc_key in ("description", "short_description", "key_features"):
                val = _safe_str(mapped.get(desc_key))
                if val:
                    desc_parts.append(val)
            description = "\n\n".join(desc_parts) if desc_parts else None

            product_data = {
                "name": name,
                "slug": slug,
                "sku": sku,
                "description": description,
                "price": price,
                "compare_at_price": compare_at_price if compare_at_price and compare_at_price > price else None,
                "image_url": _safe_str(mapped.get("image_url")),
                "images": images,
                "stock": _safe_int(mapped.get("stock"), 0),
                "is_featured": False,
            }

            if category_id:
                product_data["category_id"] = category_id
            if brand_id:
                product_data["brand_id"] = brand_id

            # Upsert logic: check if product with same SKU exists
            existing = None
            if sku:
                existing_res = supabase.table("products").select("id").eq("sku", sku).execute()
                if existing_res.data:
                    existing = existing_res.data[0]

            if existing:
                # Update existing product
                supabase.table("products").update(product_data).eq("id", existing["id"]).execute()
                summary.updated += 1
            else:
                # Handle slug uniqueness — append sku or counter
                try:
                    supabase.table("products").insert(product_data).execute()
                    summary.inserted += 1
                except Exception as insert_err:
                    err_msg = str(insert_err).lower()
                    if "duplicate" in err_msg and "slug" in err_msg:
                        # Slug conflict — make unique
                        product_data["slug"] = f"{slug}-{sku or idx}"
                        try:
                            supabase.table("products").insert(product_data).execute()
                            summary.inserted += 1
                        except Exception as retry_err:
                            summary.errors.append(f"Row {idx}: '{name}' — {str(retry_err)[:100]}")
                            summary.skipped += 1
                    else:
                        summary.errors.append(f"Row {idx}: '{name}' — {str(insert_err)[:100]}")
                        summary.skipped += 1

        except Exception as e:
            summary.errors.append(f"Row {idx}: Unexpected error — {str(e)[:120]}")
            summary.skipped += 1

    return summary


# ---------- Discount Upload ----------

@router.post("/upload/discounts", response_model=UploadSummary)
async def upload_discounts(
    file: UploadFile = File(...),
    starts_at: str = Query(..., description="Discount start date-time in ISO format (e.g. 2026-09-01T00:00:00)"),
    ends_at: str = Query(..., description="Discount end date-time in ISO format (e.g. 2026-09-30T23:59:59)"),
    _admin: CurrentUser = Depends(get_current_admin),
):
    """
    Bulk upload discounts from a CSV or XLSX file.
    Expected columns: SKU, Discount Rate
    The admin provides start and end dates as query parameters.
    Applies the discount to product prices immediately if the date range is current.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate dates
    try:
        start_dt = datetime.fromisoformat(starts_at.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS")

    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    content = await file.read()
    rows = _parse_uploaded_file(content, file.filename)

    if not rows:
        raise HTTPException(status_code=400, detail="File is empty or could not be parsed")

    now = datetime.now(timezone.utc)
    is_currently_active = start_dt <= now <= end_dt

    summary = UploadSummary()

    for idx, row in enumerate(rows, start=2):
        try:
            sku = _safe_str(row.get("sku"))
            discount_rate = _safe_float(row.get("discount rate") or row.get("discount_rate"))

            if not sku:
                summary.errors.append(f"Row {idx}: Missing SKU, skipped")
                summary.skipped += 1
                continue

            if discount_rate is None or discount_rate <= 0 or discount_rate > 100:
                summary.errors.append(f"Row {idx}: SKU '{sku}' — invalid discount rate '{row.get('discount rate', '')}', skipped")
                summary.skipped += 1
                continue

            # Look up product by SKU
            prod_res = supabase.table("products").select("id, price, compare_at_price").eq("sku", sku).execute()
            if not prod_res.data:
                summary.errors.append(f"Row {idx}: SKU '{sku}' not found in products table, skipped")
                summary.skipped += 1
                continue

            product = prod_res.data[0]
            product_id = product["id"]
            current_price = float(product["price"])
            original_price = float(product["compare_at_price"]) if product.get("compare_at_price") else current_price

            # Create discount record
            discount_data = {
                "product_id": product_id,
                "sku": sku,
                "discount_rate": discount_rate,
                "starts_at": starts_at,
                "ends_at": ends_at,
                "is_active": True,
                "original_price": original_price,
            }

            supabase.table("product_discounts").insert(discount_data).execute()

            # If the discount period is currently active, apply it to the product price
            if is_currently_active:
                discounted_price = round(original_price * (1 - discount_rate / 100), 2)
                supabase.table("products").update({
                    "compare_at_price": original_price,
                    "price": discounted_price,
                }).eq("id", product_id).execute()

            summary.inserted += 1

        except Exception as e:
            summary.errors.append(f"Row {idx}: Error — {str(e)[:120]}")
            summary.skipped += 1

    return summary


# ---------- List & Manage Discounts ----------

@router.get("/discounts", response_model=List[DiscountRecord])
async def list_discounts(
    _admin: CurrentUser = Depends(get_current_admin),
):
    """
    List all discount schedules with their current status.
    """
    try:
        res = supabase.table("product_discounts").select(
            "*, products(name)"
        ).order("created_at", desc=True).execute()

        now = datetime.now(timezone.utc)
        records = []
        for d in res.data:
            starts = datetime.fromisoformat(d["starts_at"].replace("Z", "+00:00"))
            ends = datetime.fromisoformat(d["ends_at"].replace("Z", "+00:00"))

            if not d.get("is_active"):
                disc_status = "deactivated"
            elif now < starts:
                disc_status = "upcoming"
            elif now > ends:
                disc_status = "expired"
            else:
                disc_status = "active"

            product_name = None
            if d.get("products") and isinstance(d["products"], dict):
                product_name = d["products"].get("name")

            records.append(DiscountRecord(
                id=d["id"],
                product_id=d["product_id"],
                sku=d.get("sku"),
                product_name=product_name,
                discount_rate=float(d["discount_rate"]),
                starts_at=d["starts_at"],
                ends_at=d["ends_at"],
                is_active=d.get("is_active", True),
                original_price=float(d["original_price"]) if d.get("original_price") else None,
                created_at=d.get("created_at"),
                status=disc_status,
            ))

        return records

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch discounts: {str(e)}",
        )


@router.delete("/discounts/{discount_id}")
async def delete_discount(
    discount_id: str,
    _admin: CurrentUser = Depends(get_current_admin),
):
    """
    Deactivate a discount and revert the product price to original.
    """
    try:
        # Fetch the discount record
        disc_res = supabase.table("product_discounts").select("*").eq("id", discount_id).execute()
        if not disc_res.data:
            raise HTTPException(status_code=404, detail="Discount not found")

        discount = disc_res.data[0]
        product_id = discount["product_id"]
        original_price = discount.get("original_price")

        # Revert product price if original price was recorded
        if original_price:
            supabase.table("products").update({
                "price": float(original_price),
                "compare_at_price": None,
            }).eq("id", product_id).execute()

        # Deactivate the discount
        supabase.table("product_discounts").update({
            "is_active": False,
        }).eq("id", discount_id).execute()

        return {"status": "success", "message": "Discount deactivated and product price reverted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete discount: {str(e)}",
        )
