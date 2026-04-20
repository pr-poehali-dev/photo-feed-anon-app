import { useState } from "react";
import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Все", "Аниме", "Фильмы", "Арт", "Природа", "Игры", "Спорт", "Музыка", "Другое"];

export default function SearchPage() {
  const { posts, users, currentUser } = useApp();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"photos" | "users">("photos");
  const [category, setCategory] = useState("Все");
  const navigate = useNavigate();

  const filteredPosts = posts
    .filter(p => !currentUser?.blocked.includes(p.userId))
    .filter(p => category === "Все" || p.category === category)
    .filter(p =>
      query === "" ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
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
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black tracking-tight mb-5">Поиск</h1>

      <div className="relative mb-4">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск фото, пользователей..."
          className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === "photos" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Фото
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === "users" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Люди
        </button>
      </div>

      {activeTab === "photos" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-border"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="ImageOff" size={40} className="mx-auto mb-3 opacity-30" />
              <p>Ничего не найдено</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {filteredPosts.map(post => (
                <div key={post.id} className="aspect-square relative group cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
                  <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Icon name="Heart" size={14} className="fill-white" /> {post.likes.length}
                      </span>
                    </div>
                    <span className="text-xs mt-1 bg-black/40 px-2 py-0.5 rounded-full">{post.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="UserX" size={40} className="mx-auto mb-3 opacity-30" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/50 transition-all animate-fade-in"
              >
                <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted" />
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
