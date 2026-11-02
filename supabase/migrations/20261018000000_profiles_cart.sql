-- Mijoz profillari va savat (har bir foydalanuvchi uchun alohida). Qayta ishga tushirish xavfsiz.
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text CHECK (char_length(full_name) <= 100),
  phone text CHECK (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  birthday date CHECK (birthday > '1900-01-01' AND birthday <= current_date),
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  font_size text NOT NULL DEFAULT 'normal' CHECK (font_size IN ('small','normal','large')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cart_items (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  qty int NOT NULL CHECK (qty > 0 AND qty <= 10000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.cart_items TO authenticated;
GRANT ALL ON public.profiles, public.cart_items TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own cart" ON public.cart_items;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
