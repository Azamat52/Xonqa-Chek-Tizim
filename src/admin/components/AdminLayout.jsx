import {
  BarChart3,
  Calculator,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import DataSync from "@/admin/components/DataSync";
import { LoadingOverlay, PageLoader, TopBar } from "@/admin/components/loader";
import { logout, writeToken } from "@/admin/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { loggedOut, selectIsAuthed } from "@/store/authSlice";
import { selectBusy, selectLoading } from "@/store/dataSlice";

const NAV = [
  { to: "/", label: "Boshqaruv", icon: LayoutDashboard },
  { to: "/pos", label: "Yangi savdo", icon: Calculator },
  { to: "/categories", label: "Kategoriyalar", icon: FolderTree },
  { to: "/products", label: "Mahsulotlar", icon: Package },
  { to: "/sales", label: "Savdolar", icon: ShoppingBag },
  { to: "/stats", label: "Statistika", icon: BarChart3 },
  { to: "/settings", label: "Sozlamalar", icon: Settings },
];

// Mobil pastki panelda 4 ta asosiy bo'lim, qolganlari "Yana" ichida
const MOBILE_MAIN = ["/", "/pos", "/sales", "/products"];
const MOBILE_TABS = NAV.filter((item) => MOBILE_MAIN.includes(item.to));
const MOBILE_EXTRA = NAV.filter((item) => !MOBILE_MAIN.includes(item.to));

const deskLink = ({ isActive }) =>
  isActive
    ? "flex items-center gap-3 rounded-lg bg-primary/15 px-3 py-2 text-sm font-medium !text-primary"
    : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const mobileLink = ({ isActive }) =>
  `mobile-tab ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`;

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img src="/logo.jpg" alt="Xonqa" className="size-10 shrink-0 rounded-md object-cover" />
      <div className="min-w-0">
        <p className="font-brand text-2xl leading-tight text-primary">Xonqa</p>
        <p className="text-xs text-muted-foreground">Kassa paneli</p>
      </div>
    </div>
  );
}

function PageContent() {
  const loading = useSelector(selectLoading);
  const busy = useSelector(selectBusy);
  return (
    <>
      <TopBar active={loading || busy} />
      <LoadingOverlay active={busy && !loading} />
      {loading ? <PageLoader /> : <Outlet />}
    </>
  );
}

function MobileLayout({ onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="mobile-header flex items-center justify-between gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Brand />
        <Button variant="ghost" size="icon" aria-label="Chiqish" onClick={onLogout}>
          <LogOut />
        </Button>
      </header>

      <main className="admin-main mobile-main min-w-0 flex-1 px-4 py-5">
        <PageContent />
      </main>

      <nav aria-label="Bo'limlar" className="mobile-tabbar">
        {MOBILE_TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={mobileLink}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <Button
          variant="ghost"
          className="mobile-tab text-muted-foreground"
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal />
          <span>Yana</span>
        </Button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="mobile-more">
          <SheetHeader>
            <SheetTitle>Bo'limlar</SheetTitle>
            <SheetDescription>Xonqa POS</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {MOBILE_EXTRA.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={mobileLink} onClick={() => setMoreOpen(false)}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DesktopLayout({ onLogout }) {
  return (
    <>
      <aside className="sticky top-0 flex h-dvh w-48 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:w-60">
        <div className="mb-6 px-2">
          <Brand />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={deskLink}>
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="mt-auto justify-start gap-3 px-3 text-muted-foreground"
        >
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </aside>

      <main className="admin-main min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <PageContent />
      </main>
    </>
  );
}

export default function AdminLayout() {
  const dispatch = useDispatch();
  const isAuthed = useSelector(selectIsAuthed);
  const isMobile = useIsMobile();

  if (!isAuthed) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    writeToken(null);
    dispatch(loggedOut());
  };

  return (
    <div className="admin-shell flex min-h-dvh bg-background">
      <DataSync />
      {isMobile ? (
        <MobileLayout onLogout={handleLogout} />
      ) : (
        <DesktopLayout onLogout={handleLogout} />
      )}
    </div>
  );
}
