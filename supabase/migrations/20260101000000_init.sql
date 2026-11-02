-- Supabase > SQL Editor ga to'liq nusxalab, Run bosing. Qayta ishga tushirish xavfsiz.
CREATE TABLE IF NOT EXISTS public.categories (id text PRIMARY KEY, data jsonb NOT NULL, sort int NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS public.products (id text PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.promotions (id text PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;
CREATE TABLE IF NOT EXISTS public.orders (id text PRIMARY KEY DEFAULT nextval('public.order_number_seq')::text, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.app_settings (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS public.admin_sessions (token text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.categories, public.products, public.promotions, public.orders, public.app_settings, public.admin_sessions TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
INSERT INTO public.categories (id, sort, data) VALUES
('tovuq',0,'{"id":"tovuq","name":"Tandir tovuq","emoji":"🍗","active":true,"description":""}'),
('yoniga',1,'{"id":"yoniga","name":"Yoniga","emoji":"🥗","active":true,"description":""}'),
('ichimlik',2,'{"id":"ichimlik","name":"Ichimlik","emoji":"🥤","active":true,"description":""}')
ON CONFLICT DO NOTHING;
INSERT INTO public.products (id, data) VALUES
('tovuq-butun','{"id":"tovuq-butun","name":"Butun tandir tovuq","category":"tovuq","price":145000,"weight":"1 dona","tag":"Xonqa usuli","description":"O‘z sharbatida, tandir issig‘ida pishgan butun tovuq.","image":"https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=900","available":true,"popular":true}'),
('tovuq-yarim','{"id":"tovuq-yarim","name":"Yarim tandir tovuq","category":"tovuq","price":78000,"weight":"1/2 dona","tag":"Ko‘p tanlanadi","description":"Qizargan teri, mayin go‘sht va xushbo‘y ziravor.","image":"https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":true}'),
('tovuq-son','{"id":"tovuq-son","name":"Tandir son go‘shti","category":"tovuq","price":52000,"weight":"1 porsiya","tag":"Shirali","description":"Tandirda asta pishib, ichida sharbatini saqlagan son.","image":"https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":true}'),
('non','{"id":"non","name":"Tandir non","category":"yoniga","price":8000,"weight":"1 dona","tag":"Issiq non","description":"Tandir devorida yopilgan, usti tillarang non.","image":"https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":false}'),
('salat','{"id":"salat","name":"Bahor salati","category":"yoniga","price":18000,"weight":"1 porsiya","tag":"Yangi","description":"Mavsumiy sabzavotlar, ko‘kat va yengil ta’m.","image":"https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":false}'),
('achchiq-chuchuk','{"id":"achchiq-chuchuk","name":"Achchiq-chuchuk","category":"yoniga","price":16000,"weight":"1 porsiya","tag":"Klassik","description":"Pomidor va piyozning tandir taomiga munosib jufti.","image":"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":false}'),
('suv','{"id":"suv","name":"Suv","category":"ichimlik","price":5000,"weight":"0.5 l","tag":"Salqin","description":"Sovutilgan ichimlik suvi.","image":"https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":false}'),
('choy','{"id":"choy","name":"Ko‘k choy","category":"ichimlik","price":10000,"weight":"choynak","tag":"An’anaviy","description":"Dasturxon so‘ngidagi iliq, xushbo‘y choy.","image":"https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=800","available":true,"popular":false}')
ON CONFLICT DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES
('workHours','{"enabled":true,"open":"10:00","close":"23:00"}'),
('shop','{"cardNumber":"","cardOwner":""}')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
