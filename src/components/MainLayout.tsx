import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useState } from "react";

export default function MainLayout() {
  const { currentUser, notifications } = useApp();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessages = useApp().messages.filter(
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
        <div
          className="flex items-center gap-3 px-3 py-4 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="Camera" size={20} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">ФотоЛента</span>
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
        <div className="relative mb-4">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all font-medium text-sm relative"
          >
            <Icon name="Bell" size={20} />
            Уведомления
            {unreadCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationsDropdown onClose={() => setShowNotifs(false)} />}
        </div>

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
            <NavLink to="/admin">
              <Icon name="Shield" size={16} className="text-primary" />
            </NavLink>
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
  const { notifications, setNotifications } = useApp();

  const markAll = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-scale-in z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm">Уведомления</span>
        <button onClick={markAll} className="text-xs text-primary hover:underline">Прочитать все</button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Нет уведомлений</p>
        ) : (
          notifications.slice(0, 15).map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-border last:border-0 text-sm ${!n.read ? "bg-accent/30" : ""}`}
            >
              <p className="font-medium">{n.fromUsername}</p>
              <p className="text-muted-foreground text-xs">{n.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}