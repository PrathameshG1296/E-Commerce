-- Seed Data for NovaCart E-Commerce
-- Run this in the Supabase SQL Editor AFTER running database_schema.sql.

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
('c1111111-1111-1111-1111-111111111111', 'Electronics', 'electronics', 'Cutting-edge gadgets, computers, audio systems, and accessories.'),
('c2222222-2222-2222-2222-222222222222', 'Fashion & Apparel', 'fashion', 'Premium clothing, shoes, jackets, and accessories.'),
('c3333333-3333-3333-3333-333333333333', 'Home & Kitchen', 'home-kitchen', 'Smart appliances, furniture, and kitchen utensils.'),
('c4444444-4444-4444-4444-444444444444', 'Books & Stationery', 'books-stationery', 'Best-selling novels, educational guides, and notebooks.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, price, compare_at_price, image_url, images, stock, is_featured) VALUES
-- Electronics
('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 'Studio-X Wireless Headphones', 'studio-x-headphones', 
 'Experience audio perfection with hybrid active noise cancellation, high-fidelity drivers, 40-hour battery life, and ultra-plush memory foam earcups.', 
 9999.00, 14999.00, 
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=60'], 
 45, TRUE),

('a1111111-2222-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 'Apex Mechanical Keyboard', 'apex-mechanical-keyboard', 
 'Customizable mechanical keyboard featuring clicky blue switches, per-key RGB backlighting, aviation-grade aluminum top plate, and magnetic wrist rest.', 
 4999.00, 6999.00, 
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=60'], 
 30, FALSE),

('a1111111-3333-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 'Nova 34-Inch Curved Monitor', 'nova-curved-monitor', 
 'Ultra-wide WQHD (3440 x 1440) curved gaming monitor with a rapid 144Hz refresh rate, 1ms response time, HDR 400 support, and premium color accuracy.', 
 24999.00, 34999.00, 
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1547119957-637f8679db1e?w=800&auto=format&fit=crop&q=60'], 
 15, TRUE),

-- Fashion
('a2222222-1111-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 
 'Vanguard Biker Leather Jacket', 'vanguard-leather-jacket', 
 'Handcrafted 100% genuine full-grain leather jacket. Features classic asymmetrical heavy-duty zippers, quilted interior liner, and protective lapels.', 
 7999.00, 11999.00, 
 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&auto=format&fit=crop&q=60'], 
 22, FALSE),

('a2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 
 'AeroStride Running Shoes', 'aerostride-running-shoes', 
 'Ultra-lightweight mesh knit upper, responsive foam cushion midsole for maximum energy rebound, and carbon rubber tread for durable traction.', 
 3499.00, 5499.00, 
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=60'], 
 60, TRUE),

-- Home & Kitchen
('a3333333-1111-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 
 'Barista Pro Smart Coffee Maker', 'barista-pro-coffee-maker', 
 'Wi-Fi enabled smart coffee maker. Schedule brews, customize temperature, adjust grind coarseness, and control strength directly from your phone.', 
 12999.00, 18999.00, 
 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60'], 
 10, TRUE),

('a3333333-2222-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 
 'Helios Laser Robot Vacuum', 'helios-robot-vacuum', 
 'Equipped with LiDAR navigation, 3000Pa suction power, automatic carpet detection, self-emptying base station, and dual vacuum/mop functions.', 
 18999.00, 27999.00, 
 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1563161402-8b11cf227b3b?w=800&auto=format&fit=crop&q=60'], 
 8, FALSE),

-- Books & Stationery
('a4444444-1111-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 
 'Atomic Habits (Paperback)', 'atomic-habits-book', 
 'Tiny Changes, Remarkable Results. The definitive guide by James Clear on breaking bad patterns and establishing positive daily routines.', 
 499.00, 799.00, 
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60', 
 ARRAY['https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=60'], 
 150, TRUE)
ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured;
