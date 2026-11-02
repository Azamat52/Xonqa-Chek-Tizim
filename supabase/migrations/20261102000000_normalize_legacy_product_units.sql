-- Eski mahsulotlardagi birlik nomlarini standart kalitlarga o'tkazish.
-- Masalan: dona -> piece, gramm -> g, litr -> l, qadoq -> pack.
ALTER TABLE public.pos_sale_items DROP CONSTRAINT IF EXISTS pos_sale_items_unit_check;
ALTER TABLE public.pos_sale_items
  ADD CONSTRAINT pos_sale_items_unit_check
  CHECK (unit IN ('piece', 'kg', 'g', 'l', 'm', 'pack'));

UPDATE public.products
SET data = jsonb_set(
  data,
  '{unit}',
  to_jsonb(CASE lower(trim(COALESCE(data->>'unit', 'piece')))
    WHEN 'piece' THEN 'piece' WHEN 'pieces' THEN 'piece' WHEN 'pcs' THEN 'piece'
    WHEN 'pc' THEN 'piece' WHEN 'dona' THEN 'piece' WHEN 'don' THEN 'piece'
    WHEN 'шт' THEN 'piece' WHEN 'штука' THEN 'piece' WHEN 'штуки' THEN 'piece'
    WHEN 'kg' THEN 'kg' WHEN 'kilogram' THEN 'kg' WHEN 'kilograms' THEN 'kg'
    WHEN 'kilogramm' THEN 'kg' WHEN 'килограмм' THEN 'kg' WHEN 'кг' THEN 'kg'
    WHEN 'g' THEN 'g' WHEN 'gr' THEN 'g' WHEN 'gram' THEN 'g' WHEN 'grams' THEN 'g'
    WHEN 'gramm' THEN 'g' WHEN 'грамм' THEN 'g' WHEN 'гр' THEN 'g'
    WHEN 'l' THEN 'l' WHEN 'lt' THEN 'l' WHEN 'liter' THEN 'l' WHEN 'litre' THEN 'l'
    WHEN 'litr' THEN 'l' WHEN 'литр' THEN 'l'
    WHEN 'm' THEN 'm' WHEN 'meter' THEN 'm' WHEN 'metre' THEN 'm' WHEN 'metr' THEN 'm' WHEN 'метр' THEN 'm'
    WHEN 'pack' THEN 'pack' WHEN 'package' THEN 'pack' WHEN 'paket' THEN 'pack'
    WHEN 'qadoq' THEN 'pack' WHEN 'пачка' THEN 'pack'
    ELSE 'piece'
  END),
  true
)
WHERE jsonb_typeof(data) = 'object';

-- DB funksiyasi ham frontenddan mustaqil ravishda birlikni normallashtiradi.
CREATE OR REPLACE FUNCTION public.complete_pos_sale(
  p_items jsonb,
  p_name text DEFAULT NULL,
  p_started_at timestamptz DEFAULT NULL
)
RETURNS SETOF public.pos_sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.pos_sales;
  v_total numeric := 0;
  v jsonb;
  v_product jsonb;
  v_price numeric;
  v_qty numeric;
  v_unit text;
  v_end timestamptz := clock_timestamp();
  v_start timestamptz := COALESCE(p_started_at, v_end);
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Savdo mahsulotlari noto‘g‘ri';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Savdo mahsulotlari bo‘sh yoki juda ko‘p';
  END IF;
  IF char_length(p_name) > 100 OR v_start > v_end THEN
    RAISE EXCEPTION 'Nom yoki boshlanish vaqti noto‘g‘ri';
  END IF;

  INSERT INTO public.pos_sales(total, name, started_at, duration_seconds, created_at)
  VALUES (0, NULLIF(btrim(p_name), ''), v_start,
          floor(extract(epoch FROM v_end - v_start))::integer, v_end)
  RETURNING * INTO v_sale;

  FOR v IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id' LOOP
    SELECT data INTO v_product
    FROM public.products
    WHERE id = v->>'product_id'
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Mahsulot topilmadi'; END IF;

    v_qty := (v->>'qty')::numeric;
    v_price := (v_product->>'price')::numeric;
    v_unit := CASE lower(trim(COALESCE(v_product->>'unit', 'piece')))
      WHEN 'piece' THEN 'piece' WHEN 'pieces' THEN 'piece' WHEN 'pcs' THEN 'piece'
      WHEN 'pc' THEN 'piece' WHEN 'dona' THEN 'piece' WHEN 'don' THEN 'piece'
      WHEN 'шт' THEN 'piece' WHEN 'штука' THEN 'piece' WHEN 'штуки' THEN 'piece'
      WHEN 'kg' THEN 'kg' WHEN 'kilogram' THEN 'kg' WHEN 'kilograms' THEN 'kg'
      WHEN 'kilogramm' THEN 'kg' WHEN 'килограмм' THEN 'kg' WHEN 'кг' THEN 'kg'
      WHEN 'g' THEN 'g' WHEN 'gr' THEN 'g' WHEN 'gram' THEN 'g' WHEN 'grams' THEN 'g'
      WHEN 'gramm' THEN 'g' WHEN 'грамм' THEN 'g' WHEN 'гр' THEN 'g'
      WHEN 'l' THEN 'l' WHEN 'lt' THEN 'l' WHEN 'liter' THEN 'l' WHEN 'litre' THEN 'l'
      WHEN 'litr' THEN 'l' WHEN 'литр' THEN 'l'
      WHEN 'm' THEN 'm' WHEN 'meter' THEN 'm' WHEN 'metre' THEN 'm' WHEN 'metr' THEN 'm' WHEN 'метр' THEN 'm'
      WHEN 'pack' THEN 'pack' WHEN 'package' THEN 'pack' WHEN 'paket' THEN 'pack'
      WHEN 'qadoq' THEN 'pack' WHEN 'пачка' THEN 'pack'
      ELSE 'piece'
    END;

    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 10000
       OR v_price IS NULL OR v_price < 0
       OR (v_product->>'available') = 'false' THEN
      RAISE EXCEPTION 'Mahsulot narxi yoki miqdori noto‘g‘ri';
    END IF;
    IF v_unit IN ('piece', 'g', 'pack') AND v_qty <> trunc(v_qty) THEN
      RAISE EXCEPTION 'Dona/gramm/qadoq miqdori butun son bo‘lishi kerak';
    END IF;

    INSERT INTO public.pos_sale_items(sale_id, product_id, name, qty, unit, price)
    VALUES (
      v_sale.id,
      v->>'product_id',
      COALESCE(v_product->'name'->>'uz', v_product->>'name', v->>'product_id'),
      v_qty,
      v_unit,
      v_price
    );

    v_total := v_total + v_qty * v_price;
    UPDATE public.products
    SET data = jsonb_set(
      jsonb_set(data, '{unit}', to_jsonb(v_unit), true),
      '{stock}',
      to_jsonb(greatest(0, COALESCE((data->>'stock')::numeric, 0) - v_qty)),
      true
    )
    WHERE id = v->>'product_id';
  END LOOP;

  UPDATE public.pos_sales SET total = v_total
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  RETURN NEXT v_sale;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pos_sale(jsonb, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(jsonb, text, timestamptz)
  TO service_role;

-- 4 argumentli funksiya (sale_status migration) shu 3 argumentli funksiyani chaqiradi.
NOTIFY pgrst, 'reload schema';
