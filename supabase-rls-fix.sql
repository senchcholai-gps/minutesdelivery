-- ============================================================
-- MINUTES DELIVERY — Supabase RLS Fix
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─── PRODUCTS: Public read access ───────────────────────────
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  USING (true);

-- ─── CATEGORIES: Public read access ─────────────────────────
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  USING (true);

-- ─── CART: Authenticated users manage their own rows ─────────
-- Your app uses the "cart" table (not cart_items)
DROP POLICY IF EXISTS "Users can manage cart" ON cart;
CREATE POLICY "Users can manage cart"
  ON cart
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── USER_PROFILES: Users can read their own row ─────────────
-- This fixes the 406 error when reading roles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- ─── USER_PROFILES: Service role can do everything ───────────
-- Needed for sync-role API route which uses the service key
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── ORDERS: Users manage their own orders ───────────────────
DROP POLICY IF EXISTS "Users can manage own orders" ON orders;
CREATE POLICY "Users can manage own orders"
  ON orders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── VERIFY: Check tables have data ─────────────────────────
-- Uncomment to check:
-- SELECT count(*) FROM products;
-- SELECT count(*) FROM categories;
-- SELECT id, email, role FROM user_profiles WHERE email = 'senchcholaigps@gmail.com';

-- ─── GRANT ADMIN ROLE ────────────────────────────────────────
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'senchcholaigps@gmail.com';
