-- Phase 3: Brands, Flash Sales, Analytics for Trending/Best Sellers
-- Run in Supabase SQL Editor after database_schema.sql and seed_data.sql

-- 1. Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-access to brands" ON public.brands;
CREATE POLICY "Allow public read-access to brands" ON public.brands
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to manage brands" ON public.brands;
CREATE POLICY "Allow admin to manage brands" ON public.brands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- 2. Link products to brands
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- 3. Flash sales
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-access to flash_sales" ON public.flash_sales;
CREATE POLICY "Allow public read-access to flash_sales" ON public.flash_sales
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to manage flash_sales" ON public.flash_sales;
CREATE POLICY "Allow admin to manage flash_sales" ON public.flash_sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

CREATE TABLE IF NOT EXISTS public.flash_sale_products (
    flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sale_price NUMERIC(10, 2) CHECK (sale_price >= 0),
    PRIMARY KEY (flash_sale_id, product_id)
);

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-access to flash_sale_products" ON public.flash_sale_products;
CREATE POLICY "Allow public read-access to flash_sale_products" ON public.flash_sale_products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to manage flash_sale_products" ON public.flash_sale_products;
CREATE POLICY "Allow admin to manage flash_sale_products" ON public.flash_sale_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- 4. Seed brands
INSERT INTO public.brands (id, name, slug, description, logo_url) VALUES
('b1111111-1111-1111-1111-111111111111', 'NovaTech', 'novatech', 'Premium electronics and audio gear.', NULL),
('b2222222-2222-2222-2222-222222222222', 'AeroStride', 'aerostride', 'Performance footwear and athletic wear.', NULL),
('b3333333-3333-3333-3333-333333333333', 'HomeCraft', 'homecraft', 'Smart home and kitchen appliances.', NULL),
('b4444444-4444-4444-4444-444444444444', 'Vanguard', 'vanguard', 'Premium fashion and leather goods.', NULL)
ON CONFLICT (slug) DO NOTHING;

-- 5. Assign brands to existing products
UPDATE public.products SET brand_id = 'b1111111-1111-1111-1111-111111111111'
WHERE slug IN ('studio-x-headphones', 'apex-mechanical-keyboard', 'nova-curved-monitor');

UPDATE public.products SET brand_id = 'b2222222-2222-2222-2222-222222222222'
WHERE slug = 'aerostride-running-shoes';

UPDATE public.products SET brand_id = 'b3333333-3333-3333-3333-333333333333'
WHERE slug IN ('barista-pro-coffee-maker', 'helios-robot-vacuum');

UPDATE public.products SET brand_id = 'b4444444-4444-4444-4444-444444444444'
WHERE slug = 'vanguard-leather-jacket';

-- 6. Active flash sale (starts 1 hour ago, ends in 48 hours)
INSERT INTO public.flash_sales (id, title, slug, starts_at, ends_at, is_active) VALUES
('f1111111-1111-1111-1111-111111111111', 'Mega Flash Sale', 'mega-flash-sale',
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '48 hours', TRUE)
ON CONFLICT (slug) DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    is_active = EXCLUDED.is_active;

INSERT INTO public.flash_sale_products (flash_sale_id, product_id, sale_price) VALUES
('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 7999.00),
('f1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 2999.00),
('f1111111-1111-1111-1111-111111111111', 'a3333333-1111-3333-3333-333333333333', 10999.00)
ON CONFLICT (flash_sale_id, product_id) DO UPDATE SET sale_price = EXCLUDED.sale_price;
