BEGIN;
INSERT INTO public.products(id,data) VALUES ('__sale_rule_test__','{"name":{"uz":"Sinov mahsuloti"},"price":8000,"stock":10,"unit":"piece"}') ON CONFLICT(id) DO UPDATE SET data=excluded.data;
DO $$
DECLARE s public.pos_sales; named public.pos_sales; items jsonb := '[{"product_id":"__sale_rule_test__","qty":2,"price":1}]';
BEGIN
  SELECT * INTO s FROM public.complete_pos_sale(items,NULL,clock_timestamp()-interval '125 seconds');
  IF s.name IS NOT NULL THEN RAISE EXCEPTION 'Optional name must accept NULL'; END IF;
  IF s.duration_seconds <> 125 THEN RAISE EXCEPTION 'Duration must preserve 125 elapsed seconds'; END IF;
  IF s.total <> 16000 THEN RAISE EXCEPTION 'Two products at 8000 must total 16000'; END IF;
  IF (SELECT name FROM public.pos_sale_items WHERE sale_id=s.id) <> 'Sinov mahsuloti' THEN RAISE EXCEPTION 'Saved sale must retain product name'; END IF;
  SELECT * INTO named FROM public.complete_pos_sale(items,'Ali',clock_timestamp());
  IF named.name <> 'Ali' THEN RAISE EXCEPTION 'Entered optional name must persist'; END IF;
  UPDATE public.products SET data=jsonb_set(data,'{name}', '"Yangilangan nom"') WHERE id='__sale_rule_test__';
  IF (SELECT name FROM public.pos_sale_items WHERE sale_id=s.id) <> 'Sinov mahsuloti' THEN RAISE EXCEPTION 'Old item name must not change with product edits'; END IF;
END $$;
ROLLBACK;
