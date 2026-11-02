import { ChartPie, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/admin/components/empty-state";
import { PageHeader, StatCard } from "@/admin/components/page-header";
import {
  fmtSum,
  isCancelled,
  isCompleted,
  isSaved,
  orderSum,
  pctChange,
  STATUS_LABELS,
} from "@/admin/lib/format";
import { categoryLabel, selectCategories, selectProducts, selectSales } from "@/store/dataSlice";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
};
const PERIODS = [7, 14, 30];

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const dayLabel = (key) => `${key.slice(8, 10)}.${key.slice(5, 7)}`;
const shortName = (v) => (String(v).length > 14 ? `${String(v).slice(0, 13)}…` : v);
const kFormat = (v) => `${Math.round(v / 1e3)}k`;

/** Barcha statistik hisob-kitoblar bitta joyda. */
function useStats(days) {
  const sales = useSelector(selectSales);
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);

  return useMemo(() => {
    const paid = sales.filter(isCompleted);
    const saved = sales.filter(isSaved);
    const cancelled = sales.filter(isCancelled);

    // Mahsulot bo'yicha jami
    const items = new Map();
    for (const sale of paid) {
      for (const i of sale.items) {
        const prev = items.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
        items.set(i.productId, {
          name: prev.name,
          qty: prev.qty + i.quantity,
          revenue: prev.revenue + i.price * i.quantity,
        });
      }
    }
    const top = [...items.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Kategoriya bo'yicha
    const byCategory = new Map();
    for (const [productId, v] of items) {
      const cat = products.find((p) => p.id === productId)?.category ?? "other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + v.revenue);
    }
    const categoryData = [...byCategory].map(([cat, value]) => ({
      name: categoryLabel(categories, cat),
      value,
    }));

    // Kunlik daromad (tanlangan davr)
    const now = new Date();
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daily.push({ key: dayKey(d), name: dayLabel(dayKey(d)), revenue: 0 });
    }
    const dailyByKey = new Map(daily.map((r) => [r.key, r]));
    for (const sale of paid) {
      const row = dailyByKey.get(dayKey(new Date(sale.createdAt)));
      if (row) row.revenue += sale.total;
    }

    // Bugun / kecha / oy
    const today = dayKey(now);
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yesterday = dayKey(y);
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const todaySales = paid.filter((s) => dayKey(new Date(s.createdAt)) === today);
    const revenue = orderSum(paid);

    // Holatlar bo'yicha
    const byStatus = new Map();
    for (const sale of sales) byStatus.set(sale.status, (byStatus.get(sale.status) ?? 0) + 1);

    return {
      total: sales.length,
      paidCount: paid.length,
      revenue,
      avgCheck: Math.round(revenue / Math.max(paid.length, 1)),
      soldQty: [...items.values()].reduce((s, v) => s + v.qty, 0),
      saved: { count: saved.length, sum: orderSum(saved) },
      cancelled: { count: cancelled.length, sum: orderSum(cancelled) },
      todayCount: todaySales.length,
      todayRevenue: orderSum(todaySales),
      yesterdayRevenue: orderSum(paid.filter((s) => dayKey(new Date(s.createdAt)) === yesterday)),
      monthRevenue: orderSum(paid.filter((s) => monthKey(new Date(s.createdAt)) === thisMonth)),
      // O'tgan oyning shu kunigacha bo'lgan qismi bilan solishtiriladi
      lastMonthRevenue: orderSum(
        paid.filter((s) => {
          const d = new Date(s.createdAt);
          return monthKey(d) === lastMonth && d.getDate() <= now.getDate();
        }),
      ),
      top,
      categoryData,
      daily,
      statusData: [...byStatus].map(([s, value]) => ({ name: STATUS_LABELS[s] ?? s, value })),
    };
  }, [sales, products, categories, days]);
}

function ChartPanel({
  title,
  empty,
  emptyIcon = ChartPie,
  emptyHint,
  action,
  className = "",
  children,
}) {
  return (
    <div className={`panel flex min-w-0 flex-col p-4 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {empty ? (
        <EmptyState icon={emptyIcon} hint={emptyHint} className="h-72" />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function Stats() {
  const [days, setDays] = useState(14); // faqat shu sahifadagi grafik davri
  const s = useStats(days);

  const periodButtons = (
    <div className="flex gap-1">
      {PERIODS.map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            days === d ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          {d} kun
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Statistika" subtitle="Kassa cheklari asosida" />

      {/* 1-qator: tushum */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bugungi tushum"
          value={fmtSum(s.todayRevenue)}
          trend={{
            value: pctChange(s.todayRevenue, s.yesterdayRevenue),
            label: "kechaga nisbatan",
          }}
          hint={`${s.todayCount} ta savdo`}
        />
        <StatCard
          label="Oylik tushum"
          value={fmtSum(s.monthRevenue)}
          trend={{
            value: pctChange(s.monthRevenue, s.lastMonthRevenue),
            label: "o'tgan oyga nisbatan",
          }}
          hint={`O'tgan oy shu kungacha: ${fmtSum(s.lastMonthRevenue)}`}
        />
        <StatCard label="Umumiy tushum" value={fmtSum(s.revenue)} hint="Barcha cheklar" />
        <StatCard
          label="Yakunlangan savdolar"
          value={String(s.paidCount)}
          hint={`Jami ${s.total} ta savdodan`}
        />
      </div>

      {/* 2-qator: savdo ko'rsatkichlari */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saqlangan savdolar"
          value={fmtSum(s.saved.sum)}
          hint={`${s.saved.count} ta chop etilmagan`}
        />
        <StatCard
          label="Bekor qilingan"
          value={String(s.cancelled.count)}
          hint={`${fmtSum(s.cancelled.sum)} yo'qotilgan`}
        />
        <StatCard label="O'rtacha chek" value={fmtSum(s.avgCheck)} hint="Bitta savdoga" />
        <StatCard
          label="Sotilgan miqdor"
          value={String(Math.round(s.soldQty * 100) / 100)}
          hint="Barcha birliklarda"
        />
      </div>

      {/* Daromad dinamikasi — to'liq kenglik */}
      <ChartPanel
        className="mt-6"
        title="Daromad dinamikasi"
        action={periodButtons}
        empty={s.daily.every((d) => d.revenue === 0)}
        emptyHint="Tanlangan davrda savdo yo'q."
      >
        <AreaChart data={s.daily} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={kFormat} />
          <Tooltip formatter={(v) => fmtSum(Number(v))} contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Tushum"
            stroke="var(--primary)"
            fill="url(#revGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartPanel>

      {/* Top mahsulotlar va kategoriyalar — yonma-yon */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Top mahsulotlar"
          empty={s.top.length === 0}
          emptyIcon={UtensilsCrossed}
          emptyHint="Sotuvlar bo'lgach, top mahsulotlar shu yerda chiqadi."
        >
          <BarChart data={s.top} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={kFormat}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={11}
              width={95}
              tickFormatter={shortName}
            />
            <Tooltip formatter={(v) => fmtSum(Number(v))} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="revenue" name="Tushum" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Kategoriya bo'yicha savdo"
          empty={s.categoryData.length === 0}
          emptyHint="Kategoriyalar bo'yicha savdo hali yo'q."
        >
          <PieChart>
            <Pie
              data={s.categoryData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              strokeWidth={0}
            >
              {s.categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => fmtSum(Number(v))} contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ChartPanel>
      </div>

      {/* Savdolar holati — to'liq kenglik */}
      <ChartPanel
        className="mt-4"
        title="Savdolar holati"
        empty={s.statusData.length === 0}
        emptyHint="Savdolar hali yo'q."
      >
        <BarChart data={s.statusData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={12}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={11}
            width={110}
          />
          <Tooltip formatter={(v) => [`${v} ta`, "Savdo"]} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="value" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartPanel>
    </>
  );
}
