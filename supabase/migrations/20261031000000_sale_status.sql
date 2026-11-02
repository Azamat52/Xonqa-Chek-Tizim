
-- Savdo holati: printed (chop etilgan), saved (saqlangan), cancelled (bekor qilingan)
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'printed';
DO $$ BEGIN
  ALTER TABLE public.pos_sales ADD CONSTRAINT pos_sales_status_check CHECK (status IN ('printed','saved','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE OR REPLACE FUNCTION public.complete_pos_sale(p_items jsonb, p_name text, p_started_at timestamptz, p_status text)
RETURNS SETOF public.pos_sales
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sale public.pos_sales; v_status text := COALESCE(p_status,'printed');
BEGIN
  IF v_status NOT IN ('printed','saved','cancelled') THEN RAISE EXCEPTION 'Savdo holati noto‘g‘ri'; END IF;
  SELECT * INTO v_sale FROM public.complete_pos_sale(p_items,p_name,p_started_at);
  IF v_status = 'cancelled' THEN
    -- Bekor qilingan savdo omborni kamaytirmaydi
    UPDATE public.products pr SET data=jsonb_set(pr.data,'{stock}',to_jsonb(COALESCE((pr.data->>'stock')::numeric,0)+i.qty))
      FROM public.pos_sale_items i WHERE i.sale_id=v_sale.id AND pr.id=i.product_id;
  END IF;
  UPDATE public.pos_sales SET status=v_status WHERE id=v_sale.id RETURNING * INTO v_sale;
  RETURN NEXT v_sale;
END; $$;
REVOKE ALL ON FUNCTION public.complete_pos_sale(jsonb,text,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(jsonb,text,timestamptz,text) TO service_role;
NOTIFY pgrst, 'reload schema';
