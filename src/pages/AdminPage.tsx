import { useState } from "react";
import { useApp, BanInfo } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const ADMIN_CODE = "CODEGEASSIMGODREAPER";

type AdminTab = "stats" | "users" | "posts" | "messages";

export default function AdminPage() {
  const { currentUser, users, setUsers, setCurrentUser, posts, setPosts, messages, setMessages } = useApp();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(currentUser?.isAdmin || false);
  const [codeError, setCodeError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

  // Ban modal
  const [banTarget, setBanTarget] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState("60"); // minutes
  const [banReason, setBanReason] = useState("");

  const handleCode = () => {
    if (code === ADMIN_CODE) {
      setUnlocked(true);
      setCodeError("");
      if (currentUser && !currentUser.isAdmin) {
        const updated = { ...currentUser, isAdmin: true };
        setCurrentUser(updated);
        setUsers((prev) => prev.map(u => u.id === currentUser.id ? updated : u));
      }
    } else {
      setCodeError("Неверный код. Доступ запрещён.");
    }
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Удалить пост?")) {
      setPosts((prev) => prev.filter(p => p.id !== postId));
    }
  };

  const handleToggleAdmin = (userId: string) => {
    setUsers((prev) => prev.map(u =>
      u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u
    ));
    if (userId === currentUser?.id) {
      const user = users.find(u => u.id === userId);
      if (user) setCurrentUser({ ...user, isAdmin: !user.isAdmin });
    }
  };

  const handleBanSubmit = () => {
    if (!banTarget) return;
    const minutes = parseInt(banDuration) || 60;
    const banInfo: BanInfo = {
      until: Date.now() + minutes * 60 * 1000,
      reason: banReason || "Нарушение правил",
    };
    setUsers((prev) => prev.map(u =>
      u.id === banTarget ? { ...u, ban: banInfo } : u
    ));
    setBanTarget(null);
    setBanReason("");
    setBanDuration("60");
  };

  const handleUnban = (userId: string) => {
    setUsers((prev) => prev.map(u =>
      u.id === userId ? { ...u, ban: undefined } : u
    ));
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Полностью удалить пользователя и все его данные?")) {
      setPosts((prev) => prev.filter(p => p.userId !== userId));
      setMessages((prev) => (prev as import("@/App").Message[]).filter(m => m.fromId !== userId && m.toId !== userId));
      setUsers((prev) => prev.filter(u => u.id !== userId));
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => (prev as import("@/App").Message[]).filter(m => m.id !== msgId));
  };

  const isBanned = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.ban && user.ban.until > Date.now();
  };

  const banTimeLeft = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user?.ban) return "";
    const mins = Math.ceil((user.ban.until - Date.now()) / 60000);
    return mins > 60 ? `${Math.floor(mins / 60)} ч ${mins % 60} мин` : `${mins} мин`;
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-4">
              <Icon name="Shield" size={32} className="text-destructive" />
            </div>
            <h1 className="text-2xl font-black">Зона администратора</h1>
            <p className="text-muted-foreground text-sm mt-1">Введи секретный код для доступа</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCode()}
              placeholder="Секретный код..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 mb-3 font-mono tracking-widest"
            />
            {codeError && (
              <p className="text-destructive text-sm text-center mb-3 font-medium animate-fade-in">{codeError}</p>
            )}
            <button
              onClick={handleCode}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
            >
              Подтвердить
            </button>
            <button onClick={() => navigate("/")} className="w-full mt-3 text-muted-foreground text-sm hover:text-foreground transition-colors">
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: "stats", label: "Статистика", icon: "BarChart2" },
    { id: "users", label: "Пользователи", icon: "Users" },
    { id: "posts", label: "Посты", icon: "Image" },
    { id: "messages", label: "Сообщения", icon: "Mail" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Админ-панель</h1>
          <p className="text-xs text-muted-foreground">Полный контроль над платформой</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name={tab.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {[
            { label: "Пользователей", value: users.length, icon: "Users", color: "text-blue-500" },
            { label: "Публикаций", value: posts.length, icon: "Image", color: "text-purple-500" },
            { label: "Лайков", value: totalLikes, icon: "Heart", color: "text-red-500" },
            { label: "Комментариев", value: totalComments, icon: "MessageCircle", color: "text-green-500" },
            { label: "Сообщений", value: messages.length, icon: "Mail", color: "text-yellow-500" },
            { label: "Заблокированных", value: users.filter(u => u.ban && u.ban.until > Date.now()).length, icon: "Ban", color: "text-orange-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <Icon name={stat.icon as Parameters<typeof Icon>[0]["name"]} size={28} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div className="space-y-3 animate-fade-in">
          {users.map(user => {
            const banned = isBanned(user.id);
            return (
              <div key={user.id} className={`bg-card border rounded-2xl p-4 ${banned ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{user.displayName}</p>
                      {user.isAdmin && (
                        <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded font-semibold">Admin</span>
                      )}
                      {banned && (
                        <span className="bg-destructive/20 text-destructive text-xs px-1.5 py-0.5 rounded font-semibold">
                          Бан: {banTimeLeft(user.id)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {posts.filter(p => p.userId === user.id).length} постов • {user.friends.length} друзей
                    </p>
                    {banned && user.ban && (
                      <p className="text-xs text-destructive mt-0.5">Причина: {user.ban.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAdmin(user.id)}
                      title={user.isAdmin ? "Снять права" : "Дать права"}
                      className={`p-2 rounded-xl text-sm transition-all ${user.isAdmin ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"}`}
                    >
                      <Icon name="Shield" size={14} />
                    </button>
                    {user.id !== currentUser?.id && (
                      <>
                        {banned ? (
                          <button
                            onClick={() => handleUnban(user.id)}
                            className="p-2 rounded-xl bg-secondary text-green-500 hover:bg-green-500/20 transition-all"
                            title="Разбанить"
                          >
                            <Icon name="CheckCircle" size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanTarget(user.id)}
                            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-orange-500/20 hover:text-orange-500 transition-all"
                            title="Забанить"
                          >
                            <Icon name="Ban" size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Posts */}
      {activeTab === "posts" && (
        <div className="space-y-3 animate-fade-in">
          {posts.length === 0 && <p className="text-center text-muted-foreground py-10">Нет постов</p>}
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
              <img src={post.image} alt={post.caption} className="w-16 h-16 rounded-xl object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{post.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{post.caption || "Без подписи"}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{post.category}</span>
                  <span className="text-xs text-muted-foreground">❤️ {post.likes.length}</span>
                  <span className="text-xs text-muted-foreground">💬 {post.comments.length}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all shrink-0"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {activeTab === "messages" && (
        <div className="space-y-2 animate-fade-in">
          {messages.length === 0 && <p className="text-center text-muted-foreground py-10">Нет сообщений</p>}
          {[...messages].reverse().map(msg => {
            const from = users.find(u => u.id === msg.fromId);
            const to = users.find(u => u.id === msg.toId);
            return (
              <div key={msg.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                <img
                  src={from?.avatar}
                  alt={from?.displayName}
                  className="w-9 h-9 rounded-full bg-muted shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{from?.displayName || "?"}</span>
                    {" → "}
                    <span className="font-semibold text-foreground">{to?.displayName || "?"}</span>
                  </p>
                  <p className="text-sm truncate">{msg.text}</p>
                </div>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all shrink-0"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Ban modal */}
      {banTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBanTarget(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icon name="Ban" size={20} className="text-destructive" />
              Заблокировать пользователя
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Срок (минуты)</label>
                <div className="flex gap-2 mb-2">
                  {[15, 60, 1440, 10080].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setBanDuration(String(mins))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${banDuration === String(mins) ? "bg-destructive text-white" : "bg-secondary text-secondary-foreground hover:bg-border"}`}
                    >
                      {mins < 60 ? `${mins}м` : mins < 1440 ? `${mins/60}ч` : mins < 10080 ? "сутки" : "неделя"}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={banDuration}
                  onChange={e => setBanDuration(e.target.value)}
                  placeholder="Кол-во минут"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Причина</label>
                <input
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Причина блокировки..."
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleBanSubmit}
                  className="flex-1 bg-destructive text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Заблокировать
                </button>
                <button
                  onClick={() => setBanTarget(null)}
                  className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-border transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
