import { Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/admin/components/empty-state";
import { ImagePicker } from "@/admin/components/image-picker";
import { Spinner } from "@/admin/components/loader";
import { PageHeader } from "@/admin/components/page-header";
import { fmtSum } from "@/admin/lib/format";
import { UNIT_KEYS, normalizeUnit, unitLabel } from "@/admin/lib/units";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  categoryLabel,
  deleteProduct,
  saveProduct,
  selectCategories,
  selectProducts,
} from "@/store/dataSlice";

const SELECT_CLASS = "h-9 rounded-md border border-input bg-background px-2 text-sm";

const emptyForm = (category = "") => ({
  category,
  image: "",
  price: 0,
  stock: 0,
  unit: "piece",
  popular: false,
  available: true,
  name: { uz: "" },
  description: { uz: "" },
});

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
          : "rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

/** Mahsulot qo'shish / tahrirlash oynasi. Forma qiymatlari vaqtinchalik, shuning uchun lokal. */
function ProductDialog({ product, onClose }) {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const [form, setForm] = useState(() =>
    product?.id
      ? { ...product, unit: normalizeUnit(product.unit), name: { ...product.name }, description: { ...product.description } }
      : emptyForm(categories[0]?.id),
  );
  const [imageBusy, setImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const locked = imageBusy || saving;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.category) return toast.error("Avval Kategoriyalar bo'limida kategoriya yarating");
    if (!form.name.uz.trim() || form.price <= 0) return toast.error("Nom va narxni to'ldiring");
    if (locked) return;

    setSaving(true);
    const category = categories.find((c) => c.id === form.category);
    const ok = await dispatch(saveProduct({ ...form, unit: normalizeUnit(form.unit), emoji: category?.emoji || "" })).unwrap();
    setSaving(false);
    if (ok) {
      toast.success(form.id ? "Mahsulot yangilandi" : "Mahsulot qo'shildi");
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !locked && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</DialogTitle>
          <DialogDescription>Narx tanlangan o'lchov birligi uchun kiritiladi.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <ImagePicker
            value={form.image}
            onChange={(image) => set({ image })}
            onBusyChange={setImageBusy}
            disabled={saving}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Nomi</Label>
            <Input
              id="p-name"
              value={form.name.uz}
              placeholder="Nom"
              onChange={(e) => set({ name: { uz: e.target.value } })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="p-price">Narx (so'm / {unitLabel(form.unit)})</Label>
              <Input
                id="p-price"
                type="number"
                value={form.price || ""}
                onChange={(e) => set({ price: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-unit">O'lchov birligi</Label>
              <select
                id="p-unit"
                value={form.unit || "piece"}
                onChange={(e) => set({ unit: e.target.value })}
                className={SELECT_CLASS}
              >
                {UNIT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {unitLabel(key)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-stock">Omborda bor ({unitLabel(form.unit)})</Label>
              <Input
                id="p-stock"
                type="number"
                step="any"
                value={form.stock ?? 0}
                onChange={(e) => set({ stock: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-cat">Kategoriya</Label>
              <select
                id="p-cat"
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
                className={SELECT_CLASS}
              >
                {categories.length === 0 && <option value="">Avval kategoriya yarating</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(categories, c.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="p-desc">Tavsif</Label>
            <Textarea
              id="p-desc"
              rows={2}
              value={form.description?.uz ?? ""}
              onChange={(e) => set({ description: { uz: e.target.value } })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.available}
                onCheckedChange={(available) => set({ available })}
              />
              Sotuvda
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.popular} onCheckedChange={(popular) => set({ popular })} />
              Hit mahsulot
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={locked} onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={locked}>
            {saving ? <Spinner /> : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductCard({ product: p, onEdit }) {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);

  const toggle = (available) => {
    dispatch(saveProduct({ ...p, available }));
    toast.success(available ? "Sotuvda" : "Sotuvdan olindi");
  };
  const remove = () => {
    if (!confirm(`"${p.name.uz}" o'chirilsinmi?`)) return;
    dispatch(deleteProduct(p.id));
    toast.success("O'chirildi");
  };

  return (
    <div className="panel group flex flex-col overflow-hidden transition-shadow hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {p.image && (
          <img
            src={p.image}
            alt={p.name.uz}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        <p className="absolute bottom-2 left-3 rounded-full bg-background/80 px-2.5 py-1 text-sm font-semibold text-primary backdrop-blur">
          {fmtSum(p.price)} / {unitLabel(p.unit)}
        </p>
        {p.popular && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            Hit
          </span>
        )}
        {!p.available && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive/90 px-2.5 py-1 text-xs font-medium text-destructive-foreground">
            Mavjud emas
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-1">
        <div className="min-w-0">
          <p className="truncate font-medium">{p.name.uz}</p>
          <p className="text-xs text-muted-foreground">
            {categoryLabel(categories, p.category)} · Omborda bor: {p.stock ?? 0}{" "}
            {unitLabel(p.unit)}
          </p>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{p.description?.uz}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Switch checked={p.available} onCheckedChange={toggle} />
            <span className="text-xs text-muted-foreground">
              {p.available ? "Sotuvda" : "Mavjud emas"}
            </span>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Tahrirlash" onClick={() => onEdit(p)}>
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="O'chirish" onClick={remove}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const setCategory = (value) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("category", value);
        return next;
      },
      { replace: true },
    );
  };
  const [editing, setEditing] = useState(null); // null — yopiq, {} — yangi, product — tahrirlash

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.name.uz.toLowerCase().includes(q)),
    );
  }, [products, category, query]);

  return (
    <>
      <PageHeader
        title="Mahsulotlar"
        subtitle={`${products.length} ta mahsulot`}
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="size-4" /> Yangi mahsulot
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="Hammasi"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
              label={categoryLabel(categories, c.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onEdit={setEditing} />
        ))}
        {filtered.length === 0 && (
          <div className="panel col-span-full">
            <EmptyState icon={UtensilsCrossed} hint="Bu bo'limda hali mahsulotlar yo'q." />
          </div>
        )}
      </div>

      {editing && <ProductDialog product={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
