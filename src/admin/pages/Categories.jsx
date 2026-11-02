import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { EmptyState } from "@/admin/components/empty-state";
import { Spinner } from "@/admin/components/loader";
import { PageHeader } from "@/admin/components/page-header";
import { fmtSum } from "@/admin/lib/format";
import { unitLabel } from "@/admin/lib/units";
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
  deleteCategory,
  reorderCategories,
  saveCategory,
  selectCategories,
  selectProducts,
} from "@/store/dataSlice";

const EMPTY = { id: "", name: "", emoji: "", description: "", sort: 0, active: true };
const FILTERS = [
  ["all", "Barchasi"],
  ["active", "Faol"],
  ["hidden", "Yashirin"],
  ["empty", "Bo'sh"],
];

function CategoryDialog({ category, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(category);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return toast.error("Kategoriya nomini kiriting");
    setSaving(true);
    const ok = await dispatch(saveCategory(form)).unwrap();
    setSaving(false);
    if (ok) {
      toast.success(form.id ? "Kategoriya yangilandi" : "Kategoriya yaratildi");
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
          <DialogDescription>Kassada mahsulotlar shu nom bilan guruhlanadi.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-emoji">Emoji</Label>
              <Input
                id="c-emoji"
                value={form.emoji}
                maxLength={8}
                onChange={(e) => set({ emoji: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Nomi</Label>
              <Input
                id="c-name"
                value={form.name}
                maxLength={40}
                placeholder="Masalan: Ichimliklar"
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-desc">Tavsif</Label>
            <Textarea
              id="c-desc"
              value={form.description}
              maxLength={300}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-sort">Tartib raqami</Label>
            <Input
              id="c-sort"
              type="number"
              value={form.sort}
              onChange={(e) => set({ sort: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <Label htmlFor="c-active">Faol</Label>
              <p className="text-xs text-muted-foreground">O'chirilsa, kategoriya yashiriladi</p>
            </div>
            <Switch
              id="c-active"
              checked={form.active !== false}
              onCheckedChange={(active) => set({ active })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner /> : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Categories() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const products = useSelector(selectProducts);

  // Sahifaning vaqtinchalik UI holati
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [toggling, setToggling] = useState(null);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const countOf = (id) => products.filter((p) => p.category === id).length;

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return categories.filter((c) => {
      if (q && !`${c.name} ${c.description}`.toLowerCase().includes(q)) return false;
      if (filter === "active") return c.active !== false;
      if (filter === "hidden") return c.active === false;
      if (filter === "empty") return !products.some((p) => p.category === c.id);
      return true;
    });
  }, [categories, products, query, filter]);

  const toggleActive = async (c) => {
    setToggling(c.id);
    const ok = await dispatch(saveCategory({ ...c, active: c.active === false })).unwrap();
    setToggling(null);
    if (ok)
      toast.success(c.active === false ? "Kategoriya faollashtirildi" : "Kategoriya yashirildi");
  };

  const move = (c, dir) => {
    const ids = categories.map((x) => x.id);
    const i = ids.indexOf(c.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    dispatch(reorderCategories(ids));
  };

  const remove = async (c) => {
    if (countOf(c.id))
      return toast.error("Avval bu kategoriyadagi mahsulotlarni o'chiring yoki ko'chiring");
    if (!confirm(`"${c.name}" kategoriyasini o'chirasizmi?`)) return;
    if (await dispatch(deleteCategory(c.id)).unwrap()) {
      toast.success("O'chirildi");
      setSelectedId(null);
    }
  };

  const dialog = editing && <CategoryDialog category={editing} onClose={() => setEditing(null)} />;
  const selected = categories.find((c) => c.id === selectedId);

  // --- Bitta kategoriya ichidagi mahsulotlar ---
  if (selected) {
    const items = products.filter((p) => p.category === selected.id);
    return (
      <div>
        <Button variant="ghost" className="mb-3" onClick={() => setSelectedId(null)}>
          <ArrowLeft /> Kategoriyalar
        </Button>
        <PageHeader
          title={`${selected.emoji ? selected.emoji + " " : ""}${selected.name}`}
          subtitle={selected.description || `${items.length} ta mahsulot`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={toggling === selected.id}
                onClick={() => toggleActive(selected)}
              >
                {toggling === selected.id ? (
                  <Spinner />
                ) : selected.active === false ? (
                  <Eye />
                ) : (
                  <EyeOff />
                )}
                {selected.active === false ? "Ko'rsatish" : "Yashirish"}
              </Button>
              <Button variant="outline" onClick={() => setEditing({ ...selected })}>
                <Pencil /> Tahrirlash
              </Button>
              <Button variant="outline" onClick={() => remove(selected)}>
                <Trash2 /> O'chirish
              </Button>
            </div>
          }
        />
        {items.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="Bu kategoriyada mahsulot yo'q"
              hint="Mahsulotlar bo'limida qo'shing"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="panel flex items-center gap-3 p-3">
                {p.image ? (
                  <img src={p.image} alt={p.name.uz} className="size-14 rounded-md object-cover" />
                ) : (
                  <div className="size-14 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name.uz}</p>
                  <p className="text-sm text-primary">
                    {fmtSum(p.price)} / {unitLabel(p.unit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.available ? "Sotuvda" : "Mavjud emas"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {dialog}
      </div>
    );
  }

  // --- Kategoriyalar ro'yxati ---
  const hiddenCount = categories.filter((c) => c.active === false).length;
  const emptyCount = categories.filter((c) => countOf(c.id) === 0).length;

  return (
    <div>
      <PageHeader
        title="Kategoriyalar"
        subtitle={`${categories.length} ta kategoriya · ${hiddenCount} ta yashirin · ${emptyCount} ta bo'sh`}
        action={
          <Button onClick={() => setEditing({ ...EMPTY, sort: categories.length })}>
            <Plus /> Kategoriya yaratish
          </Button>
        }
      />

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Kategoriya qidirish…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {FILTERS.map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={FolderTree}
            title="Hali kategoriya yo'q"
            hint="“Kategoriya yaratish” tugmasini bosing"
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Search}
            title="Hech narsa topilmadi"
            hint="Qidiruv yoki filtrni o'zgartiring"
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => {
            const count = countOf(c.id);
            const index = categories.findIndex((x) => x.id === c.id);
            return (
              <div
                key={c.id}
                className={`panel flex items-center gap-2 p-4 ${c.active === false ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Yuqoriga"
                    disabled={index === 0}
                    onClick={() => move(c, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Pastga"
                    disabled={index === categories.length - 1}
                    onClick={() => move(c, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
                    {c.emoji || "📂"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span
                      className={`block text-xs ${count === 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {count === 0 ? "Mahsulot yo'q" : `${count} ta mahsulot`}
                      {c.active === false ? " · Yashirin" : ""}
                    </span>
                  </span>
                </button>
                {toggling === c.id ? (
                  <Spinner />
                ) : (
                  <Switch
                    aria-label="Faol"
                    checked={c.active !== false}
                    onCheckedChange={() => toggleActive(c)}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Tahrirlash"
                  onClick={() => setEditing({ ...c })}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="O'chirish"
                  onClick={() => remove(c)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {dialog}
    </div>
  );
}
