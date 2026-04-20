import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useState } from "react";

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
    { to: "/", icon: "Home", label: "Лента" },
    { to: "/search", icon: "Search", label: "Поиск" },
    { to: "/messages", icon: "MessageCircle", label: "Сообщения", badge: unreadMessages },
    { to: "/friends", icon: "Users", label: "Друзья" },
    { to: "/profile", icon: "User", label: "Профиль" },
    { to: "/settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 border-r border-border bg-card z-40 p-4">
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3 py-4 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="https://cdn.poehali.dev/projects/5a81856f-b49b-4ba7-a2f2-0c1b449020a1/files/6eed71b3-ed58-48c0-9022-801ec84ee019.jpg"
            alt="ачё?"
            className="w-9 h-9 rounded-xl object-cover"
          />
          <span className="font-black text-2xl tracking-tight">ачё?</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative font-medium text-sm
                ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <Icon name={item.icon} size={20} />
              {item.label}
              {item.badge ? (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Notifications bell */}
        <div className="relative mb-1">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowAdmin(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm relative
              ${showNotifs ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Icon name="Bell" size={20} />
            Уведомления
            {unreadCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Admin panel shortcut */}
        <div className="relative mb-3">
          <button
            onClick={() => { setShowAdmin(!showAdmin); setShowNotifs(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm relative
              ${showAdmin ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Icon name="Shield" size={20} />
            Админ-панель
          </button>
        </div>

        {/* Dropdown panels */}
        {showNotifs && (
          <NotificationsDropdown onClose={() => setShowNotifs(false)} />
        )}
        {showAdmin && (
          <AdminCodeDropdown onClose={() => setShowAdmin(false)} />
        )}

        {/* User avatar */}
        <div className="flex items-center gap-3 px-3 py-3 border-t border-border mt-2 pt-4">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.displayName}
            className="w-9 h-9 rounded-full object-cover bg-muted"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentUser?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{currentUser?.username}</p>
          </div>
          {currentUser?.isAdmin && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold">ADM</span>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all relative
              ${isActive ? "text-primary" : "text-muted-foreground"}`
            }
          >
            <Icon name={item.icon} size={22} />
            {item.badge ? (
              <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {item.badge}
              </span>
            ) : null}
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
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

  const getIcon = (type: string) => {
    if (type === "like") return "❤️";
    if (type === "comment") return "💬";
    if (type === "message") return "✉️";
    return "👤";
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "только что";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return `${Math.floor(diff / 86400000)} д`;
  };

  return (
    <div className="fixed left-4 bottom-[180px] w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm">Уведомления</span>
        <div className="flex gap-2">
          <button onClick={markAll} className="text-xs text-primary hover:underline">Всё прочитано</button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {myNotifs.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Нет уведомлений</p>
        ) : (
          myNotifs.slice(0, 20).map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-border/50 last:border-0 flex items-start gap-3 ${!n.read ? "bg-accent/20" : ""}`}
            >
              <span className="text-lg shrink-0">{getIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-semibold">{n.fromUsername}</span> {n.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminCodeDropdown({ onClose }: { onClose: () => void }) {
  const { currentUser, users, setUsers, setCurrentUser } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ADMIN_CODE = "CODEGEASSIMGODREAPER";

  const handleSubmit = () => {
    if (code === ADMIN_CODE) {
      if (currentUser && !currentUser.isAdmin) {
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

  if (currentUser?.isAdmin) {
    return (
      <div className="fixed left-4 bottom-[140px] w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-scale-in z-50">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Icon name="Shield" size={16} className="text-primary" />
          Ты уже администратор
        </p>
        <button
          onClick={() => { onClose(); navigate("/admin"); }}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          Открыть панель
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-4 bottom-[140px] w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-scale-in z-50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Icon name="Shield" size={16} className="text-primary" />
          Введи код доступа
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <Icon name="X" size={14} />
        </button>
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
      <button
        onClick={handleSubmit}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
      >
        Войти
      </button>
    </div>
  );
}
