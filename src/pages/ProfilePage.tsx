import { useState } from "react";
import { useApp } from "@/App";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function ProfilePage() {
  const { currentUser, users, setCurrentUser, setUsers, posts } = useApp();
  const { userId } = useParams();
  const navigate = useNavigate();

  const profileUser = userId ? users.find(u => u.id === userId) : currentUser;
  const isOwn = !userId || userId === currentUser?.id;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profileUser?.displayName || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profileUser?.avatar || "");
  const [bannerUrl, setBannerUrl] = useState(profileUser?.banner || "");
  const [avatarTab, setAvatarTab] = useState<"url" | "gen">("url");
  const [genSeed, setGenSeed] = useState(profileUser?.username || "");

  if (!profileUser) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Пользователь не найден</p>
    </div>
  );

  const userPosts = posts.filter(p => p.userId === profileUser.id);
  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isBlocked = currentUser?.blocked.includes(profileUser.id);

  const getAvatarUrl = () => {
    if (avatarTab === "url" && avatarUrl.trim()) return avatarUrl.trim();
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${genSeed || currentUser?.username}`;
  };

  const handleSave = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatar: getAvatarUrl(),
      banner: bannerUrl.trim(),
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map(u => u.id === currentUser.id ? updated : u));
    setEditing(false);
  };

  const handleAddFriend = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      friends: isFriend
        ? currentUser.friends.filter(id => id !== profileUser.id)
        : [...currentUser.friends, profileUser.id],
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const handleBlock = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      blocked: isBlocked
        ? currentUser.blocked.filter(id => id !== profileUser.id)
        : [...currentUser.blocked, profileUser.id],
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Banner + Avatar */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 animate-fade-in">
        {/* Banner */}
        <div className="relative h-36 bg-gradient-to-br from-primary/30 to-primary/10">
          {profileUser.banner ? (
            <img src={profileUser.banner} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-secondary" />
          )}
          {isOwn && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl transition-all"
              title="Изменить баннер"
            >
              <Icon name="Camera" size={16} />
            </button>
          )}
        </div>

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName}
                className="w-20 h-20 rounded-2xl border-4 border-card bg-muted object-cover shadow-lg"
              />
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all"
                >
                  <Icon name="Pencil" size={11} />
                </button>
              )}
            </div>

            {!editing && (
              <div className="flex gap-2">
                {isOwn ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-border transition-all"
                  >
                    <Icon name="Pencil" size={14} />
                    Редактировать
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAddFriend}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                        ${isFriend ? "bg-secondary text-secondary-foreground hover:bg-border" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                    >
                      <Icon name={isFriend ? "UserMinus" : "UserPlus"} size={14} />
                      {isFriend ? "Удалить" : "Добавить"}
                    </button>
                    <button
                      onClick={() => navigate(`/messages?with=${profileUser.id}`)}
                      className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-border transition-all"
                    >
                      <Icon name="MessageCircle" size={14} />
                      Написать
                    </button>
                    <button
                      onClick={handleBlock}
                      className={`p-2 rounded-xl text-sm transition-all
                        ${isBlocked ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}`}
                    >
                      <Icon name="Ban" size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Имя</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Имя"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">О себе</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="О себе..."
                  rows={2}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Avatar section */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Аватарка</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setAvatarTab("url")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${avatarTab === "url" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >
                    Ссылка URL
                  </button>
                  <button
                    onClick={() => setAvatarTab("gen")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${avatarTab === "gen" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >
                    Сгенерировать
                  </button>
                </div>
                {avatarTab === "url" ? (
                  <input
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://... (ссылка на фото)"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <input
                    value={genSeed}
                    onChange={e => setGenSeed(e.target.value)}
                    placeholder="Любое слово для стиля"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
                {/* Preview */}
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={getAvatarUrl()}
                    alt="preview"
                    className="w-12 h-12 rounded-xl object-cover bg-muted border border-border"
                    onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`; }}
                  />
                  <p className="text-xs text-muted-foreground">Предпросмотр аватарки</p>
                </div>
              </div>

              {/* Banner section */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Баннер (URL изображения)</label>
                <input
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://... (ссылка на баннер)"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="banner preview"
                    className="mt-2 w-full h-20 object-cover rounded-xl border border-border"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                  Сохранить
                </button>
                <button onClick={() => setEditing(false)} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-border transition-all">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-xl">{profileUser.displayName}</h2>
                {profileUser.isAdmin && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">Admin</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
              {profileUser.bio && <p className="text-sm mt-2 leading-relaxed">{profileUser.bio}</p>}
              <div className="flex items-center gap-5 mt-3 text-sm">
                <span><strong>{userPosts.length}</strong> <span className="text-muted-foreground">постов</span></span>
                <span><strong>{profileUser.friends.length}</strong> <span className="text-muted-foreground">друзей</span></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts grid */}
      {!editing && (
        <>
          <h3 className="font-bold mb-4">Публикации</h3>
          {userPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Image" size={40} className="mx-auto mb-3 opacity-30" />
              <p>Нет публикаций</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {userPosts.map(post => (
                <div key={post.id} className="aspect-square relative group">
                  <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Icon name="Heart" size={16} className="fill-white" /> {post.likes.length}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Icon name="MessageCircle" size={16} /> {post.comments.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
