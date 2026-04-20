import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

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
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black tracking-tight mb-6">Настройки</h1>

      {/* Theme */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 animate-fade-in">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Icon name="Palette" size={18} />
          Оформление
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold text-sm
              ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            <Icon name="Sun" size={18} />
            Светлая
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold text-sm
              ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            <Icon name="Moon" size={18} />
            Тёмная
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 animate-fade-in">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Icon name="User" size={18} />
          Аккаунт
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Логин</span>
            <span className="font-mono font-semibold">@{currentUser?.username}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Имя</span>
            <span className="font-semibold">{currentUser?.displayName}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Статус</span>
            <span className={`font-semibold ${currentUser?.isAdmin ? "text-primary" : "text-muted-foreground"}`}>
              {currentUser?.isAdmin ? "Администратор" : "Пользователь"}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-border transition-all"
        >
          <Icon name="Pencil" size={14} />
          Редактировать профиль
        </button>
      </div>

      {/* Blocked */}
      {blockedUsers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 animate-fade-in">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Icon name="Ban" size={18} />
            Заблокированные
            <span className="bg-destructive/20 text-destructive text-xs px-2 py-0.5 rounded-full">{blockedUsers.length}</span>
          </h2>
          <div className="space-y-3">
            {blockedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <img src={user.avatar} alt={user.displayName} className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-all font-medium"
                >
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 animate-fade-in">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Icon name="Info" size={18} />
          О приложении
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>ФотоЛента — социальная сеть для фотографий</p>
          <p>Версия 1.0.0</p>
          <p className="text-xs mt-2 bg-accent/30 text-accent-foreground px-3 py-2 rounded-lg font-mono">
            Антиспам: максимум 5 сообщений за 45 секунд
          </p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 py-3.5 rounded-2xl font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all animate-fade-in"
      >
        <Icon name="LogOut" size={18} />
        Выйти из аккаунта
      </button>
    </div>
  );
}
