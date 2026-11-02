import { ChevronDown, ImageIcon, Printer, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/admin/components/page-header";
import Receipt from "@/admin/components/Receipt";
import { StatusBadge } from "@/admin/components/status-badge";
import { saleDate, saleDuration, saleMoney } from "@/admin/lib/sale-details";
import { unitLabel } from "@/admin/lib/units";
import { printReceipt } from "@/admin/lib/print-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { selectProducts, selectSales } from "@/store/dataSlice";
import { selectSale, setReceipt } from "@/store/saleSlice";

const PAGE_SIZE = 30;
const FILTERS = [
  { key: "printed", label: "Chop etilgan" },
  { key: "saved", label: "Saqlangan" },
  { key: "cancelled", label: "Bekor qilingan" },
  { key: "all", label: "Hammasi" },
];

function SaleCard({ sale, imageOf, open, onToggle }) {
  const dispatch = useDispatch();

  const print = () => {
    dispatch(
      setReceipt({
        ...sale,
        items: sale.items.map((i) => ({
          name: i.name,
          qty: i.quantity,
          unit: i.unit,
          price: i.price,
        })),
      }),
    );
    setTimeout(printReceipt, 180);
  };

  return (
    <article
      data-status={sale.status}
      className={cn("sale-card panel min-w-0 cursor-pointer p-4", open && "is-open")}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-semibold">{sale.name || "Nomsiz savdo"}</h2>
            <StatusBadge status={sale.status} />
          </div>
          <p className="break-all text-xs text-muted-foreground">Chek № {sale.id}</p>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform duration-500", open && "rotate-180")}
        />
      </div>

      <div className="mt-3 flex -space-x-2">
        {sale.items
          .slice(0, 6)
          .map((i, k) =>
            imageOf(i.productId) ? (
              <img
                key={k}
                src={imageOf(i.productId)}
                alt={i.name}
                className="size-8 rounded-full border-2 border-card object-cover"
              />
            ) : null,
          )}
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Savdo vaqti</p>
          <p>{saleDate(sale.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sarflangan vaqt</p>
          <p>{saleDuration(sale.durationSeconds)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Umumiy narx</p>
          <p className="font-semibold text-primary">{saleMoney(sale.total)}</p>
        </div>
      </div>

      <div className="sale-details" data-open={open}>
        <div className="overflow-hidden">
          <div className="mt-4 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Boshlangan: {saleDate(sale.startedAt)}
              </p>
              {sale.status !== "cancelled" && (
                <Button size="sm" onClick={print}>
                  <Printer /> Chop etish
                </Button>
              )}
            </div>
            {sale.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-border py-2 text-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {imageOf(item.productId) ? (
                    <img
                      src={imageOf(item.productId)}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} {unitLabel(item.unit)} × {saleMoney(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-medium">{saleMoney(item.quantity * item.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Sales() {
  const sales = useSelector(selectSales);
  const products = useSelector(selectProducts);
  const { receipt } = useSelector(selectSale);
  const [params, setParams] = useSearchParams();

  // Filtr URL da saqlanadi, qidiruv/sahifa — vaqtinchalik UI holati
  const fromUrl = params.get("status");
  const status = FILTERS.some((f) => f.key === fromUrl) ? fromUrl : "printed";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const imageOf = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.image]));
    return (id) => map.get(id);
  }, [products]);

  const counts = useMemo(
    () => sales.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {}),
    [sales],
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return sales.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        `${s.id} ${s.name || ""} ${s.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(q),
    );
  }, [sales, status, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const changeStatus = (key) => {
    setParams({ status: key }, { replace: true });
    setPage(1);
    setExpanded(null);
  };

  return (
    <>
      <PageHeader
        title="Savdolar"
        subtitle={`${rows.length} ta savdo · ${saleMoney(rows.reduce((sum, s) => sum + s.total, 0))}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => changeStatus(f.key)}
            className={cn("sale-filter", `sale-filter-${f.key}`, status === f.key && "is-active")}
          >
            {f.label}
            <span className="sale-filter-count">
              {f.key === "all" ? sales.length : counts[f.key] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Savdolarni qidirish"
          className="pl-9"
          placeholder="Nomi, mahsulot yoki chek raqami"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="space-y-3">
        {rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((sale) => (
          <SaleCard
            key={sale.id}
            sale={sale}
            imageOf={imageOf}
            open={expanded === sale.id}
            onToggle={() => setExpanded(expanded === sale.id ? null : sale.id)}
          />
        ))}
        {!rows.length && (
          <div className="py-12 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto mb-3 size-8" />
            {query ? "Savdo topilmadi" : "Bu holatda savdo yo'q"}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>
            Oldingi
          </Button>
          <span>
            {current} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}

      <Receipt sale={receipt} />
    </>
  );
}
