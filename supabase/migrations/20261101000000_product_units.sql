-- Mahsulot o'lchov birliklari: dona, kg, gramm, litr, metr, qadoq
ALTER TABLE public.pos_sale_items DROP CONSTRAINT IF EXISTS pos_sale_items_unit_check;
ALTER TABLE public.pos_sale_items ADD CONSTRAINT pos_sale_items_unit_check
  CHECK (unit IN ('piece','kg','g','l','m','pack'));

CREATE OR REPLACE FUNCTION public.complete_pos_sale(p_items jsonb, p_name text DEFAULT NULL, p_started_at timestamptz DEFAULT NULL)
RETURNS SETOF public.pos_sales
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sale public.pos_sales; v_total numeric := 0; v jsonb; v_product jsonb; v_price numeric; v_qty numeric;
  v_end timestamptz := clock_timestamp(); v_start timestamptz := COALESCE(p_started_at, v_end);
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN RAISE EXCEPTION 'Savdo mahsulotlari noto‘g‘ri'; END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Savdo mahsulotlari bo‘sh yoki juda ko‘p'; END IF;
  IF char_length(p_name) > 100 OR v_start > v_end THEN RAISE EXCEPTION 'Nom yoki boshlanish vaqti noto‘g‘ri'; END IF;
  INSERT INTO public.pos_sales(total,name,started_at,duration_seconds,created_at)
    VALUES(0,NULLIF(btrim(p_name),''),v_start,floor(extract(epoch FROM v_end-v_start))::integer,v_end) RETURNING * INTO v_sale;
  FOR v IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id' LOOP
    SELECT data INTO v_product FROM public.products WHERE id=v->>'product_id' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Mahsulot topilmadi'; END IF;
    v_qty := (v->>'qty')::numeric; v_price := (v_product->>'price')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 10000 OR v_price IS NULL OR v_price < 0 OR (v_product->>'available') = 'false' THEN RAISE EXCEPTION 'Mahsulot narxi yoki miqdori noto‘g‘ri'; END IF;
    IF COALESCE(v_product->>'unit','piece') NOT IN ('piece','kg','g','l','m','pack') THEN RAISE EXCEPTION 'Mahsulot birligi noto‘g‘ri'; END IF;
    IF COALESCE(v_product->>'unit','piece') IN ('piece','g','pack') AND v_qty<>trunc(v_qty) THEN RAISE EXCEPTION 'Dona miqdori butun son bo‘lsin'; END IF;
    INSERT INTO public.pos_sale_items(sale_id,product_id,name,qty,unit,price)
      VALUES(v_sale.id,v->>'product_id',COALESCE(v_product->'name'->>'uz',v_product->>'name',v->>'product_id'),v_qty,COALESCE(v_product->>'unit','piece'),v_price);
    v_total := v_total + v_qty*v_price;
    UPDATE public.products SET data=jsonb_set(data,'{stock}',to_jsonb(greatest(0,COALESCE((data->>'stock')::numeric,0)-v_qty))) WHERE id=v->>'product_id';
  END LOOP;
  UPDATE public.pos_sales SET total=v_total WHERE id=v_sale.id RETURNING * INTO v_sale;
  RETURN NEXT v_sale;
END; $$;
REVOKE ALL ON FUNCTION public.complete_pos_sale(jsonb,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(jsonb,text,timestamptz) TO service_role;
NOTIFY pgrst, 'reload schema';
