import { useState } from "react";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const ADMIN_CODE = "CODEGEASSIMGODREAPER";

export default function AdminPage() {
  const { currentUser, users, setUsers, setCurrentUser, posts, setPosts, messages } = useApp();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(currentUser?.isAdmin || false);
  const [codeError, setCodeError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "stats">("stats");

  const handleCode = () => {
    if (code === ADMIN_CODE) {
      setUnlocked(true);
      setCodeError("");
      if (currentUser && !currentUser.isAdmin) {
        const updated = { ...currentUser, isAdmin: true };
        setCurrentUser(updated);
        setUsers(users.map(u => u.id === currentUser.id ? updated : u));
      }
    } else {
      setCodeError("Неверный код. Доступ запрещён.");
    }
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Удалить пост?")) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleToggleAdmin = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u
    ));
    if (userId === currentUser?.id) {
      const user = users.find(u => u.id === userId);
      if (user) setCurrentUser({ ...user, isAdmin: !user.isAdmin });
    }
  };

  const handleBanUser = (userId: string) => {
    if (window.confirm("Удалить пользователя?")) {
      setPosts(posts.filter(p => p.userId !== userId));
      setUsers(users.filter(u => u.id !== userId));
    }
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
      <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
        {(["stats", "users", "posts"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "stats" ? "Статистика" : tab === "users" ? "Пользователи" : "Посты"}
          </button>
        ))}
      </div>

      {activeTab === "stats" && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {[
            { label: "Пользователей", value: users.length, icon: "Users", color: "text-blue-500" },
            { label: "Публикаций", value: posts.length, icon: "Image", color: "text-purple-500" },
            { label: "Лайков", value: totalLikes, icon: "Heart", color: "text-red-500" },
            { label: "Комментариев", value: totalComments, icon: "MessageCircle", color: "text-green-500" },
            { label: "Сообщений", value: messages.length, icon: "Mail", color: "text-yellow-500" },
            { label: "Категорий", value: 8, icon: "Tag", color: "text-pink-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <Icon name={stat.icon as Parameters<typeof Icon>[0]["name"]} size={28} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-3 animate-fade-in">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
              <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  {user.isAdmin && (
                    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded font-semibold">Admin</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {posts.filter(p => p.userId === user.id).length} постов • {user.friends.length} друзей
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAdmin(user.id)}
                  title={user.isAdmin ? "Снять права" : "Дать права"}
                  className={`p-2 rounded-xl text-sm transition-all ${user.isAdmin ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"}`}
                >
                  <Icon name="Shield" size={14} />
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleBanUser(user.id)}
                    className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-3 animate-fade-in">
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
    </div>
  );
}
