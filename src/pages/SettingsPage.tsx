import { useState } from "react";
import { useApp, ACCENT_COLORS, AccentColor, NitroProfile } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const ADMIN_CODE = "CODEGEASSIMGODREAPER";

const BADGES = [
  { id: "nitro", label: "✦ Nitro",  desc: "Эксклюзивный значок" },
  { id: "boost", label: "🚀 Boost", desc: "Буст" },
  { id: "dev",   label: "🛠 Dev",   desc: "Разработчик" },
  { id: "mod",   label: "🛡 Mod",   desc: "Модератор" },
];

// Extended palette
const EXTRA_COLORS = [
  "#8b5cf6","#6366f1","#3b82f6","#06b6d4","#10b981",
  "#22c55e","#84cc16","#eab308","#f97316","#ef4444",
  "#ec4899","#f43f5e","#a855f7","#14b8a6","#64748b",
  "#ffffff","#000000","#1e293b","#fbbf24","#34d399",
];

export default function SettingsPage() {
  const { theme, setTheme, currentUser, setCurrentUser, users, setUsers } = useApp();
  const navigate = useNavigate();

  // Badge unlock
  const [badgeCode, setBadgeCode] = useState("");
  const [badgeUnlocked, setBadgeUnlocked] = useState(currentUser?.isAdmin || false);
  const [badgeCodeError, setBadgeCodeError] = useState("");
  const [showBadgeInput, setShowBadgeInput] = useState(false);

  // Custom color picker
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#8b5cf6");

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePasswordChange = () => {
    setPwError("");
    setPwSuccess(false);
    if (!currentUser) return;
    const stored = localStorage.getItem(`pw_${currentUser.username}`);
    if (!stored || stored !== pwCurrent) {
      setPwError("Неверный текущий пароль"); return;
    }
    if (pwNew.length < 6) {
      setPwError("Новый пароль — минимум 6 символов"); return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Пароли не совпадают"); return;
    }
    localStorage.setItem(`pw_${currentUser.username}`, pwNew);
    setPwSuccess(true);
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setTimeout(() => { setPwSuccess(false); setShowPasswordChange(false); }, 2000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  const blockedUsers = users.filter(u => currentUser?.blocked.includes(u.id));

  const handleUnblock = (userId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, blocked: currentUser.blocked.filter(id => id !== userId) };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const updateNitro = (patch: Partial<NitroProfile>) => {
    if (!currentUser) return;
    const current = currentUser.nitro || { accentColor: "purple" as AccentColor };
    const updated = { ...currentUser, nitro: { ...current, ...patch } };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const applyCustomColor = (hex: string) => {
    // Convert hex to hsl for css variable
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    document.documentElement.style.setProperty("--primary", hsl);
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      nitro: { ...(currentUser.nitro || { accentColor: "purple" as AccentColor }), customColor: hex }
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const handleBadgeCode = () => {
    if (badgeCode === ADMIN_CODE) {
      setBadgeUnlocked(true);
      setBadgeCodeError("");
      setShowBadgeInput(false);
    } else {
      setBadgeCodeError("Неверный код");
    }
  };

  const currentAccent = (currentUser?.nitro?.accentColor || "purple") as AccentColor;
  const currentBadge = currentUser?.nitro?.badge;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-black tracking-tight mb-6">Настройки</h1>

      {/* Theme */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Icon name="Palette" size={16} /> Тема
        </h2>
        <div className="flex gap-3">
          {(["light", "dark"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold text-sm
                ${theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              <Icon name={t === "light" ? "Sun" : "Moon"} size={17} />
              {t === "light" ? "Светлая" : "Тёмная"}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color — no Nitro label */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Icon name="Palette" size={16} /> Цвет акцента
        </h2>

        {/* Preset colors */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {(Object.entries(ACCENT_COLORS) as [AccentColor, { label: string; css: string; hex: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => updateNitro({ accentColor: key })}
              title={val.label}
              className={`aspect-square rounded-full border-4 transition-all hover:scale-110
                ${currentAccent === key ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: val.hex }}
            />
          ))}
        </div>

        {/* Extended palette */}
        <div className="grid grid-cols-10 gap-1.5 mb-3">
          {EXTRA_COLORS.map(hex => (
            <button
              key={hex}
              onClick={() => { setCustomColor(hex); applyCustomColor(hex); }}
              title={hex}
              className={`aspect-square rounded-full border-2 transition-all hover:scale-110 ${
                currentUser?.nitro?.customColor === hex ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>

        {/* Full color picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 border border-dashed border-primary/60 text-primary px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 transition-all"
          >
            <Icon name="Pipette" size={15} />
            Своя палитра
          </button>
          {showPicker && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <button
                onClick={() => applyCustomColor(customColor)}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              >
                Применить
              </button>
            </div>
          )}
          <div
            className="w-7 h-7 rounded-full border-2 border-foreground ml-auto"
            style={{ backgroundColor: currentUser?.nitro?.customColor || ACCENT_COLORS[currentAccent]?.hex }}
            title="Текущий цвет"
          />
        </div>
      </div>

      {/* Badges — hidden, unlock with code */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Icon name="Award" size={16} /> Значки профиля
          </h2>
          {!badgeUnlocked && (
            <button
              onClick={() => setShowBadgeInput(!showBadgeInput)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-all"
              title="Ввести код доступа"
            >
              <Icon name="Lock" size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {!badgeUnlocked ? (
          <div>
            {showBadgeInput ? (
              <div className="space-y-2 animate-fade-in">
                <input
                  type="password"
                  value={badgeCode}
                  onChange={e => { setBadgeCode(e.target.value); setBadgeCodeError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleBadgeCode()}
                  placeholder="Код доступа..."
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
                {badgeCodeError && <p className="text-destructive text-xs">{badgeCodeError}</p>}
                <button onClick={handleBadgeCode} className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:opacity-90">
                  Разблокировать
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">🔒 Доступно только с кодом</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateNitro({ badge: undefined })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${!currentBadge ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              Без значка
            </button>
            {BADGES.map(b => (
              <button
                key={b.id}
                onClick={() => updateNitro({ badge: b.id as NitroProfile["badge"] })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                  ${currentBadge === b.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {b.label}
                <span className="text-xs text-muted-foreground ml-auto">{b.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Icon name="User" size={16} /> Аккаунт
        </h2>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Логин</span>
            <span className="font-mono font-semibold">@{currentUser?.username}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Имя</span>
            <span className="font-semibold">{currentUser?.displayName}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Статус</span>
            <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${currentUser?.isAdmin ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
              {currentUser?.isAdmin ? "Администратор" : "Пользователь"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-full text-sm font-semibold hover:bg-secondary transition-all"
          >
            <Icon name="Pencil" size={14} /> Редактировать профиль
          </button>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="flex items-center gap-2 border border-border py-2.5 px-4 rounded-full text-sm font-semibold hover:bg-secondary transition-all"
          >
            <Icon name="KeyRound" size={14} /> Пароль
          </button>
        </div>

        {/* Password change form */}
        {showPasswordChange && (
          <div className="mt-4 space-y-3 animate-fade-in border-t border-border pt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Смена пароля</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Текущий пароль</label>
              <input
                type="password"
                value={pwCurrent}
                onChange={e => { setPwCurrent(e.target.value); setPwError(""); }}
                placeholder="••••••••"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Новый пароль</label>
              <input
                type="password"
                value={pwNew}
                onChange={e => { setPwNew(e.target.value); setPwError(""); }}
                placeholder="Минимум 6 символов"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Повтори новый пароль</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={e => { setPwConfirm(e.target.value); setPwError(""); }}
                placeholder="••••••••"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {pwError && <p className="text-destructive text-xs font-medium">{pwError}</p>}
            {pwSuccess && <p className="text-green-500 text-xs font-medium">✓ Пароль успешно изменён</p>}
            <button
              onClick={handlePasswordChange}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-all"
            >
              Сохранить пароль
            </button>
          </div>
        )}
      </div>

      {/* Blocked users */}
      {blockedUsers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
          <h2 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Icon name="Ban" size={16} /> Заблокированные
            <span className="bg-destructive/20 text-destructive text-xs px-2 py-0.5 rounded-full">{blockedUsers.length}</span>
          </h2>
          <div className="space-y-3">
            {blockedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <img src={user.avatar} alt={user.displayName} className="w-10 h-10 rounded-full bg-muted object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <button onClick={() => handleUnblock(user.id)} className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-secondary transition-all font-medium">
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 border border-destructive/40 text-destructive py-3.5 rounded-2xl font-semibold hover:bg-destructive hover:text-white transition-all"
      >
        <Icon name="LogOut" size={18} /> Выйти из аккаунта
      </button>
    </div>
  );
}