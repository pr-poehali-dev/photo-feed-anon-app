import { useApp, ACCENT_COLORS, AccentColor, NitroProfile } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const PROFILE_EFFECTS = [
  { id: "none",     label: "Нет",          preview: "bg-secondary" },
  { id: "aurora",   label: "Аврора",       preview: "bg-gradient-to-br from-green-400 via-cyan-400 to-blue-500" },
  { id: "sunset",   label: "Закат",        preview: "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" },
  { id: "galaxy",   label: "Галактика",    preview: "bg-gradient-to-br from-purple-900 via-blue-900 to-black" },
  { id: "sakura",   label: "Сакура",       preview: "bg-gradient-to-br from-pink-200 via-rose-300 to-pink-400" },
  { id: "ocean",    label: "Океан",        preview: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600" },
  { id: "fire",     label: "Огонь",        preview: "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600" },
  { id: "midnight", label: "Полночь",      preview: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800" },
];

const BADGES = [
  { id: "nitro", label: "✦ Nitro",  desc: "Эксклюзивный значок" },
  { id: "boost", label: "🚀 Boost", desc: "Буст сервера" },
  { id: "dev",   label: "🛠 Dev",   desc: "Разработчик" },
  { id: "mod",   label: "🛡 Mod",   desc: "Модератор" },
];

export default function SettingsPage() {
  const { theme, setTheme, currentUser, setCurrentUser, users, setUsers } = useApp();
  const navigate = useNavigate();

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

  const currentAccent = (currentUser?.nitro?.accentColor || "purple") as AccentColor;
  const currentEffect = currentUser?.nitro?.profileEffect || "none";
  const currentBadge = currentUser?.nitro?.badge;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-black tracking-tight mb-6">Настройки</h1>

      {/* Theme */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Icon name="Palette" size={16} />
          Тема
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold text-sm
              ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            <Icon name="Sun" size={17} /> Светлая
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold text-sm
              ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            <Icon name="Moon" size={17} /> Тёмная
          </button>
        </div>
      </div>

      {/* Nitro — Accent color */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <span className="text-base">✦</span>
            Цвет акцента
          </h2>
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">Nitro</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
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
        <p className="text-xs text-muted-foreground mt-2">Цвет кнопок, ссылок и акцентов</p>
      </div>

      {/* Nitro — Profile effect */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Icon name="Sparkles" size={16} />
            Эффект профиля
          </h2>
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">Nitro</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PROFILE_EFFECTS.map(effect => (
            <button
              key={effect.id}
              onClick={() => updateNitro({ profileEffect: effect.id })}
              className={`rounded-xl overflow-hidden border-2 transition-all hover:scale-105
                ${currentEffect === effect.id ? "border-primary" : "border-transparent"}`}
            >
              <div className={`h-12 ${effect.preview}`} />
              <p className={`text-[10px] font-medium py-1 text-center ${currentEffect === effect.id ? "text-primary" : "text-muted-foreground"}`}>
                {effect.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Nitro — Badge */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Icon name="Award" size={16} />
            Значок профиля
          </h2>
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">Nitro</span>
        </div>
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
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Icon name="User" size={16} />
          Аккаунт
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
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center justify-center gap-2 border border-border py-2.5 rounded-full text-sm font-semibold hover:bg-secondary transition-all"
        >
          <Icon name="Pencil" size={14} />
          Редактировать профиль
        </button>
      </div>

      {/* Blocked users */}
      {blockedUsers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
          <h2 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Icon name="Ban" size={16} />
            Заблокированные
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
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-secondary transition-all font-medium"
                >
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
        className="w-full flex items-center justify-center gap-2 border border-destructive/40 text-destructive py-3.5 rounded-2xl font-semibold hover:bg-destructive hover:text-white transition-all animate-fade-in"
      >
        <Icon name="LogOut" size={18} />
        Выйти из аккаунта
      </button>
    </div>
  );
}
