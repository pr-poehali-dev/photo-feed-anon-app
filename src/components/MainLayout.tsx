import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useState } from "react";

const ANIME_ICON = "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg";

export default function MainLayout() {
  const { currentUser, notifications, messages } = useApp();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const unreadCount = notifications.filter(
    n => n.targetUserId === currentUser?.id && !n.read
  ).length;

  const unreadMessages = messages.filter(
    m => m.toId === currentUser?.id && !m.read
  ).length;

  const navItems = [
    { to: "/", icon: "House", label: "Лента" },
    { to: "/search", icon: "Search", label: "Поиск" },
    { to: "/messages", icon: "MessageCircle", label: "Сообщения", badge: unreadMessages },
    { to: "/friends", icon: "Users", label: "Друзья" },
    { to: "/profile", icon: "User", label: "Профиль" },
    { to: "/settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Discord-style sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-[hsl(var(--card))] border-r border-border z-40">
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-4 py-5 cursor-pointer border-b border-border hover:bg-secondary/50 transition-all"
          onClick={() => navigate("/")}
        >
          <img
            src={ANIME_ICON}
            alt="ачё?"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
          />
          <span className="font-black text-3xl tracking-tight leading-none">ачё?</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 p-2 pt-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative font-medium text-sm
                ${isActive
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon name={item.icon} size={19} />
                  {item.label}
                  {item.badge ? (
                    <span className="ml-auto bg-destructive text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Notifications */}
        <div className="px-2 pb-1 relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowAdmin(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
              ${showNotifs ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Icon name="Bell" size={19} />
            Уведомления
            {unreadCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Admin */}
        <div className="px-2 pb-2 relative">
          <button
            onClick={() => { setShowAdmin(!showAdmin); setShowNotifs(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
              ${showAdmin ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Icon name="Shield" size={19} />
            Админ
          </button>
        </div>

        {/* User bar — Discord style */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-all"
          >
            <div className="relative shrink-0">
              <img
                src={currentUser?.avatar || ANIME_ICON}
                alt={currentUser?.displayName}
                className="w-9 h-9 rounded-full object-cover bg-muted"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm truncate leading-tight">{currentUser?.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">@{currentUser?.username}</p>
            </div>
            {currentUser?.isAdmin && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">ADM</span>
            )}
            {currentUser?.nitro && (
              <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">✦</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex items-center justify-around px-1 py-1">
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative
              ${isActive ? "text-primary" : "text-muted-foreground"}`
            }
          >
            <Icon name={item.icon} size={22} />
            {item.badge ? (
              <span className="absolute top-1 right-1 bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {item.badge}
              </span>
            ) : null}
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Overlays */}
      {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      {showAdmin && <AdminCodePanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, setNotifications, currentUser } = useApp();
  const myNotifs = notifications.filter(n => n.targetUserId === currentUser?.id);

  const markAll = () => {
    setNotifications(prev =>
      (prev as import("@/App").Notification[]).map(n =>
        n.targetUserId === currentUser?.id ? { ...n, read: true } : n
      )
    );
    onClose();
  };

  const getEmoji = (type: string) => {
    if (type === "like") return "❤️";
    if (type === "comment") return "💬";
    if (type === "message") return "✉️";
    return "👥";
  };

  const timeAgo = (ts: number) => {
    const d = Date.now() - ts;
    if (d < 60000) return "сейчас";
    if (d < 3600000) return `${Math.floor(d / 60000)} мин`;
    if (d < 86400000) return `${Math.floor(d / 3600000)} ч`;
    return `${Math.floor(d / 86400000)} д`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed left-60 bottom-24 md:bottom-auto md:top-auto w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-sm">Уведомления</span>
          <div className="flex gap-3">
            <button onClick={markAll} className="text-xs text-primary hover:underline font-medium">Прочитано</button>
            <button onClick={onClose}><Icon name="X" size={16} className="text-muted-foreground hover:text-foreground" /></button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {myNotifs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Bell" size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Пусто</p>
            </div>
          ) : (
            myNotifs.slice(0, 25).map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-all ${!n.read ? "bg-primary/5" : ""}`}>
                {n.fromAvatar ? (
                  <img src={n.fromAvatar} className="w-9 h-9 rounded-full shrink-0 bg-muted" />
                ) : (
                  <span className="text-xl shrink-0">{getEmoji(n.type)}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{n.fromUsername}</span>{" "}
                    <span className="text-muted-foreground">{n.text}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function AdminCodePanel({ onClose }: { onClose: () => void }) {
  const { currentUser, users, setUsers, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (currentUser?.isAdmin) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="fixed left-60 bottom-16 w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-scale-in z-50">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Icon name="Shield" size={16} className="text-primary" /> Ты администратор
          </p>
          <button
            onClick={() => { onClose(); navigate("/admin"); }}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          >
            Открыть панель
          </button>
        </div>
      </>
    );
  }

  const handleSubmit = () => {
    if (code === "CODEGEASSIMGODREAPER") {
      if (currentUser) {
        const updated = { ...currentUser, isAdmin: true };
        setCurrentUser(updated);
        setUsers((prev: import("@/App").User[]) => prev.map(u => u.id === currentUser.id ? updated : u));
      }
      onClose();
      navigate("/admin");
    } else {
      setError("Неверный код");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed left-60 bottom-16 w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-scale-in z-50">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Icon name="Shield" size={16} className="text-primary" /> Код доступа
          </p>
          <button onClick={onClose}><Icon name="X" size={14} className="text-muted-foreground" /></button>
        </div>
        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Секретный код..."
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono mb-2"
        />
        {error && <p className="text-destructive text-xs mb-2">{error}</p>}
        <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
          Войти
        </button>
      </div>
    </>
  );
}
