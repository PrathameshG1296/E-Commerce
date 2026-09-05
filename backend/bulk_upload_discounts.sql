-- Migration: Add SKU to products & Create product_discounts table
-- Run this in the Supabase SQL Editor

-- 1. Add SKU column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- 2. Create product_discounts table for scheduled discounts
CREATE TABLE IF NOT EXISTS public.product_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT,
    discount_rate NUMERIC(5, 2) NOT NULL CHECK (discount_rate > 0 AND discount_rate <= 100),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    original_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (ends_at > starts_at)
);

-- Enable RLS
ALTER TABLE public.product_discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_discounts
CREATE POLICY "Allow public read-access to active discounts" ON public.product_discounts
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage discounts" ON public.product_discounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Trigger for updated_at on product_discounts
CREATE OR REPLACE TRIGGER update_product_discounts_updated_at
    BEFORE UPDATE ON public.product_discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_discounts_active
    ON public.product_discounts (is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_product_discounts_product_id
    ON public.product_discounts (product_id);

CREATE INDEX IF NOT EXISTS idx_products_sku
    ON public.products (sku);
