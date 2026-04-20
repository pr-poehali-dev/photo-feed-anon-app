import { useState } from "react";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const FALLBACK = "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg";

export default function SearchPage() {
  const { posts, users, currentUser } = useApp();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"photos" | "users">("photos");
  const navigate = useNavigate();

  // Показываем ВСЕ публичные посты всех пользователей (кроме заблокированных)
  const filteredPosts = posts
    .filter(p => !currentUser?.blocked.includes(p.userId))
    .filter(p => p.privacy !== "private")
    .filter(p =>
      query === "" ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      p.displayName.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  // Показываем ВСЕХ зарегистрированных пользователей
  const filteredUsers = users
    .filter(u => u.id !== currentUser?.id && !currentUser?.blocked.includes(u.id))
    .filter(u =>
      query === "" ||
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="max-w-[600px] mx-auto px-4 py-4">
      <div className="py-3 mb-3 border-b border-border/50">
        <h1 className="text-xl font-black tracking-tight mb-3">Поиск</h1>
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск постов, пользователей..."
            className="w-full bg-secondary border border-border rounded-full pl-11 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-secondary rounded-full">
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all
            ${activeTab === "photos" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Публикации ({filteredPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all
            ${activeTab === "users" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Люди ({filteredUsers.length})
        </button>
      </div>

      {activeTab === "photos" && (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="ImageOff" size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Нет публикаций</p>
              <p className="text-sm mt-1 opacity-60">Зарегистрируй друзей и публикуй посты!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="aspect-square relative group cursor-pointer"
                  onClick={() => navigate(`/profile/${post.userId}`)}
                >
                  {post.image && !post.image.startsWith("data:audio") ? (
                    <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex flex-col items-center justify-center gap-1">
                      {post.image?.startsWith("data:audio") ? (
                        <Icon name="Mic" size={24} className="text-primary opacity-60" />
                      ) : (
                        <>
                          <Icon name="AlignLeft" size={18} className="text-muted-foreground opacity-40" />
                          <p className="text-[10px] text-muted-foreground px-2 text-center truncate w-full">{post.caption}</p>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                    <span className="flex items-center gap-1 text-sm font-bold">❤️ {post.likes.length}</span>
                    <span className="text-xs opacity-80">@{post.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="UserX" size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Пользователи не найдены</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-secondary/60 transition-all animate-fade-in border border-transparent hover:border-border"
              >
                <img
                  src={user.avatar || FALLBACK}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full bg-muted object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm">{user.displayName}</p>
                    {user.isAdmin && (
                      <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">Admin</span>
                    )}
                    {user.nitro?.badge && (
                      <span className="text-[11px]">
                        {user.nitro.badge === "nitro" ? "✦" : user.nitro.badge === "boost" ? "🚀" : user.nitro.badge === "dev" ? "🛠" : "🛡"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  {user.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{posts.filter(p => p.userId === user.id).length} постов</span>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
