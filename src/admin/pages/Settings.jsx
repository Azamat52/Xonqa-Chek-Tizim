import {
  Bell,
  KeyRound,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sun,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { LoadingOverlay, Spinner } from "@/admin/components/loader";
import { fetchShopSettings, saveAdminCredentials } from "@/admin/lib/api";
import { playOrderSound } from "@/admin/lib/notify";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { resetSettings, selectSettings, updateSettings } from "@/store/settingsSlice";

const THEMES = [
  { value: "light", label: "Yorug'", icon: Sun },
  { value: "dark", label: "Qorong'i", icon: Moon },
  { value: "system", label: "Qurilmaga mos", icon: Monitor },
];

const FIELD_CLASS = "h-9 rounded-md border border-input bg-background px-3 text-sm";

function SettingRow({ title, htmlFor, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-5 last:border-0 sm:gap-4">
      <label htmlFor={htmlFor} className="min-w-0 text-sm font-medium">
        {title}
      </label>
      {children}
    </div>
  );
}

/** Login/parolni o'zgartirish — forma lokal, chunki faqat shu yerda ishlatiladi. */
function CredentialsSection() {
  const [form, setForm] = useState({ adminLogin: "", adminPassword: "", currentPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShopSettings()
      .then((d) => setForm((f) => ({ ...f, adminLogin: d?.adminLogin ?? "" })))
      .catch(() => toast.error("Sozlamalarni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (form.adminLogin.trim().length < 3) return toast.error("Login kamida 3 ta belgi bo'lsin");
    if (form.adminPassword && form.adminPassword.length < 4)
      return toast.error("Parol kamida 4 ta belgi bo'lsin");
    if (!form.currentPassword) return toast.error("Joriy parolni kiriting");

    setSaving(true);
    try {
      const res = await saveAdminCredentials(form);
      setForm({ adminLogin: res.adminLogin, adminPassword: "", currentPassword: "" });
      toast.success("Login va parol saqlandi");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (id, title, key, type = "text", placeholder = "") => (
    <SettingRow title={title} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`${FIELD_CLASS} w-56`}
      />
    </SettingRow>
  );

  return (
    <section className="border-t border-border py-6">
      <LoadingOverlay active={loading || saving} />
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <KeyRound className="size-5 text-primary" /> Login va parol
      </h2>
      {field("s-login", "Login", "adminLogin")}
      {field(
        "s-pass",
        "Yangi parol",
        "adminPassword",
        "password",
        "O'zgartirmasangiz bo'sh qoldiring",
      )}
      {field("s-cur", "Joriy parol", "currentPassword", "password", "Tasdiqlash uchun")}
      <Button className="mt-3" onClick={save} disabled={saving}>
        <Save /> {saving ? <Spinner /> : "Saqlash"}
      </Button>
    </section>
  );
}

export default function Settings() {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const update = (patch) => dispatch(updateSettings(patch));

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-primary">Xonqa POS</p>
          <h1 className="text-3xl font-bold">Sozlamalar</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            dispatch(resetSettings());
            toast.success("Sozlamalar tiklandi");
          }}
        >
          <RotateCcw /> Tiklash
        </Button>
      </header>

      <CredentialsSection />

      <section className="border-t border-border py-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
          <Sun className="size-5 text-primary" /> Ko'rinish
        </h2>
        <div aria-label="Rang rejimi" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={settings.theme === value ? "default" : "outline"}
              aria-pressed={settings.theme === value}
              className="h-16 justify-start px-5"
              onClick={() => update({ theme: value })}
            >
              <Icon /> {label}
            </Button>
          ))}
        </div>
        <SettingRow title="Ixcham ko'rinish" htmlFor="compact">
          <Switch
            id="compact"
            checked={settings.compact}
            onCheckedChange={(compact) => update({ compact })}
          />
        </SettingRow>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-5 text-primary" /> Savdo bildirishnomalari
        </h2>
        <SettingRow title="Yangi savdo xabari" htmlFor="notifications">
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={(notifications) => update({ notifications })}
          />
        </SettingRow>
        <SettingRow title="Xabar ko'rinish vaqti" htmlFor="duration">
          <select
            id="duration"
            className={`${FIELD_CLASS} disabled:opacity-50`}
            value={settings.notificationDuration}
            disabled={!settings.notifications}
            onChange={(e) => update({ notificationDuration: Number(e.target.value) })}
          >
            {[5, 8, 15].map((v) => (
              <option key={v} value={v}>
                {v} soniya
              </option>
            ))}
          </select>
        </SettingRow>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Volume2 className="size-5 text-primary" /> Tovush
        </h2>
        <SettingRow title="Savdo kelganda tovush" htmlFor="sound">
          <Switch
            id="sound"
            checked={settings.sound}
            onCheckedChange={(sound) => update({ sound })}
          />
        </SettingRow>
        <SettingRow title="Tovush balandligi" htmlFor="volume">
          <div className="flex w-full max-w-xs items-center gap-3">
            <input
              id="volume"
              type="range"
              min="0"
              max="100"
              step="5"
              disabled={!settings.sound}
              value={settings.volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              className="min-w-0 flex-1 accent-primary disabled:opacity-50"
            />
            <output htmlFor="volume" className="w-12 text-right text-sm tabular-nums">
              {settings.volume}%
            </output>
          </div>
        </SettingRow>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={!settings.sound || settings.volume === 0}
            onClick={() => playOrderSound(settings.volume)}
          >
            <Volume2 /> Tovushni sinash
          </Button>
          <Button
            variant="outline"
            disabled={!settings.notifications}
            onClick={() =>
              toast.success("🔔 Sinov savdosi", {
                position: "top-center",
                description: "Xonqa",
                duration: settings.notificationDuration * 1000,
              })
            }
          >
            <Bell /> Xabarni sinash
          </Button>
        </div>
      </section>

      <footer className="flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
        <SlidersHorizontal className="size-4 shrink-0" /> Shaxsiy sozlamalar · Ushbu brauzer
      </footer>
    </div>
  );
}
