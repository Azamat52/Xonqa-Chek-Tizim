// Fon jarayonlari: ma'lumotni har 4 soniyada yangilash, yangi savdo xabari va tovush.
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fmtSum } from "@/admin/lib/format";
import { playOrderSound, unlockSound } from "@/admin/lib/notify";
import { saleNotice, salesLink } from "@/admin/lib/sale-status";
import { refreshData, selectLoading, selectSales } from "@/store/dataSlice";
import { selectSettings } from "@/store/settingsSlice";

const POLL_MS = 4000;

export default function DataSync() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sales = useSelector(selectSales);
  const loading = useSelector(selectLoading);
  const settings = useSelector(selectSettings);
  const knownIds = useRef(null);

  // Davriy yangilash (faqat sahifa ko'rinib turganda)
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") dispatch(refreshData());
    };
    dispatch(refreshData());
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [dispatch]);

  // Brauzer tovushni faqat foydalanuvchi harakatidan keyin ruxsat beradi
  useEffect(() => {
    window.addEventListener("pointerdown", unlockSound);
    window.addEventListener("keydown", unlockSound);
    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, []);

  // Boshqa qurilmadan kelgan yangi savdolar haqida xabar
  useEffect(() => {
    if (loading) return;
    if (knownIds.current === null) {
      knownIds.current = new Set(sales.map((s) => s.id));
      return;
    }
    const fresh = sales.filter((s) => !knownIds.current.has(s.id));
    fresh.forEach((s) => knownIds.current.add(s.id));
    if (!fresh.length) return;

    const notices = fresh.map((sale) => ({ sale, notice: saleNotice(sale.status) }));
    if (settings.sound && notices.some(({ notice }) => notice.sound)) {
      playOrderSound(settings.volume);
    }
    if (!settings.notifications) return;

    notices.forEach(({ sale, notice }) => {
      toast[notice.kind](notice.title, {
        position: "top-center",
        duration: settings.notificationDuration * 1000,
        description: `${sale.name || "Nomsiz savdo"} · ${fmtSum(sale.total)}`,
        action: { label: "Ko'rish", onClick: () => navigate(salesLink(sale.status)) },
      });
    });
  }, [sales, loading, settings, navigate]);

  return null;
}
