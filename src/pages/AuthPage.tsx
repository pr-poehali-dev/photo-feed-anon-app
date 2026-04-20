import { useState, useEffect } from "react";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";

export default function AuthPage() {
  const { users, setUsers, setCurrentUser } = useApp();

  useEffect(() => {
    // clean up old demo accounts from v1
  }, []);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const stored = localStorage.getItem(`pw_${username}`);
    if (!stored) { setError("Пользователь не найден"); return; }
    if (stored !== password) { setError("Неверный пароль"); return; }
    const user = users.find(u => u.username === username);
    if (!user) { setError("Пользователь не найден"); return; }
    setCurrentUser(user);
  };

  const handleRegister = () => {
    setError("");
    if (!username.trim() || !password.trim() || !displayName.trim() || !phone.trim()) {
      setError("Заполни все поля"); return;
    }
    if (username.length < 3) { setError("Логин минимум 3 символа"); return; }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (users.find(u => u.username === username)) {
      setError("Этот логин уже занят"); return;
    }
    const newUser = {
      id: Date.now().toString(),
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
      bio: "",
      avatar: "",
      banner: "",
      phone: phone.trim(),
      isAdmin: false,
      friends: [],
      blocked: [],
    };
    localStorage.setItem(`pw_${newUser.username}`, password);
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <img
            src="https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"
            alt="ачё?"
            className="w-20 h-20 rounded-3xl object-cover mx-auto mb-4 shadow-2xl shadow-primary/30 ring-4 ring-primary/30"
          />
          <h1 className="text-4xl font-black tracking-tight">ачё?</h1>
          <p className="text-muted-foreground mt-1 text-sm">Делись моментами с миром</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Имя</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Как тебя зовут?"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Номер телефона</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 999 000 00 00"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Логин</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center font-medium animate-fade-in">{error}</p>
            )}

            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/30 mt-2"
            >
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}