import { ChartColumn, Package, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/admin/components/empty-state";
import { PageHeader, StatCard } from "@/admin/components/page-header";
import { StatusBadge } from "@/admin/components/status-badge";
import { fmtDate, fmtSum, isCompleted, isSaved, orderSum, pctChange } from "@/admin/lib/format";
import { selectProducts, selectSales } from "@/store/dataSlice";

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
};

const dayOf = (date) => new Date(date).toLocaleDateString("ru-RU");

export default function Dashboard() {
  const sales = useSelector(selectSales);
  const products = useSelector(selectProducts);

  const stats = useMemo(() => {
    const paid = sales.filter(isCompleted);
    const revenue = orderSum(paid);
    const today = dayOf(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dayOf(yesterdayDate);

    const byDay = new Map();
    for (const sale of paid) {
      const key = new Date(sale.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
      byDay.set(key, (byDay.get(key) ?? 0) + sale.total);
    }

    return {
      paidCount: paid.length,
      revenue,
      avg: paid.length ? Math.round(revenue / paid.length) : 0,
      savedCount: sales.filter(isSaved).length,
      todayRevenue: orderSum(paid.filter((s) => dayOf(s.createdAt) === today)),
      yesterdayRevenue: orderSum(paid.filter((s) => dayOf(s.createdAt) === yesterday)),
      chart: Array.from(byDay, ([day, total]) => ({ day, total })).reverse(),
    };
  }, [sales]);

  return (
    <>
      <PageHeader title="Boshqaruv paneli" subtitle="Kassa ko'rsatkichlari" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Umumiy savdo"
          value={fmtSum(stats.revenue)}
          hint={`${stats.paidCount} ta savdo · bugun ${fmtSum(stats.todayRevenue)}`}
          trend={{
            value: pctChange(stats.todayRevenue, stats.yesterdayRevenue),
            label: "bugun / kecha",
          }}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Saqlangan savdolar"
          value={String(stats.savedCount)}
          hint="Chop etilmagan"
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          label="O'rtacha chek"
          value={fmtSum(stats.avg)}
          hint="Bitta savdoga"
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          label="Mahsulotlar"
          value={String(products.length)}
          hint={`${products.filter((p) => p.available).length} ta sotuvda`}
          icon={<Package className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel min-w-0 p-4 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Kunlik savdo</h2>
          {stats.chart.length === 0 ? (
            <EmptyState
              icon={ChartColumn}
              hint="Savdolar tushgach, kunlik savdo shu yerda ko'rinadi."
              className="h-64"
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(v) => `${Math.round(v / 1e3)}k`}
                  />
                  <Tooltip formatter={(v) => fmtSum(Number(v))} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="panel min-w-0 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Oxirgi savdolar</h2>
            <Link to="/sales?status=all" className="text-xs text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          {sales.length === 0 && <EmptyState icon={Receipt} hint="Hali savdolar yo'q." />}
          <ul className="space-y-3">
            {sales.slice(0, 6).map((sale) => (
              <li key={sale.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{sale.name || "Nomsiz savdo"}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(sale.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{fmtSum(sale.total)}</p>
                  <StatusBadge status={sale.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
