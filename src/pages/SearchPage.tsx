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

  const filteredPosts = posts
    .filter(p => !currentUser?.blocked.includes(p.userId))
    .filter(p => {
      if (p.privacy === "private") return false;
      if (p.privacy === "friends") return currentUser?.friends.includes(p.userId);
      return true;
    })
    .filter(p =>
      query === "" ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.likes.length - a.likes.length);

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
          Публикации
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all
            ${activeTab === "users" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Люди
        </button>
      </div>

      {activeTab === "photos" && (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="ImageOff" size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Ничего не найдено</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
              {filteredPosts.map(post => (
                <div key={post.id} className="aspect-square relative group cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
                  {post.image && !post.image.startsWith("data:audio") ? (
                    <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex flex-col items-center justify-center gap-1">
                      <Icon name="FileText" size={24} className="text-muted-foreground opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="flex items-center gap-1 text-sm font-bold">❤️ {post.likes.length}</span>
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
                <img src={user.avatar || FALLBACK} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  {user.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
                </div>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
