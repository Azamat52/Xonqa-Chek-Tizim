import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { LoadingOverlay, Spinner } from "@/admin/components/loader";
import { login, writeToken } from "@/admin/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loggedIn, selectIsAuthed } from "@/store/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const isAuthed = useSelector(selectIsAuthed);

  // Forma maydonlari faqat shu sahifaga tegishli — global store kerak emas
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const res = await login(loginName, password).catch(() => null);
    setSubmitting(false);

    if (res?.ok && res.token) {
      writeToken(res.token);
      dispatch(loggedIn(res.token));
      toast.success("Xush kelibsiz!");
    } else {
      toast.error("Login yoki parol noto'g'ri");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-6">
      <LoadingOverlay active={submitting} />
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-5 p-5 sm:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.jpg" alt="Xonqa" className="size-14 shrink-0 rounded-md object-cover" />
            <h1 className="font-brand text-5xl leading-tight text-primary">Xonqa</h1>
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">Kassa</p>
          <p className="text-sm text-muted-foreground">Panelga kirish</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login">Login</Label>
          <Input
            id="login"
            placeholder="Loginingizni kiriting"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Parol</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Parolingizni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Spinner /> : "Kirish"}
        </Button>
      </form>
    </div>
  );
}
