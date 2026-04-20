import { useState, useRef } from "react";
import { useApp, ACCENT_COLORS } from "@/App";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fileToDataUrl } from "@/lib/fileToDataUrl";

const FALLBACK = "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg";

const BADGE_LABELS: Record<string, { label: string; color: string }> = {
  nitro: { label: "✦ Nitro", color: "from-purple-500 to-pink-500" },
  boost: { label: "🚀 Boost", color: "from-pink-500 to-rose-500" },
  dev:   { label: "🛠 Dev",   color: "from-yellow-500 to-amber-500" },
  mod:   { label: "🛡 Mod",   color: "from-green-500 to-emerald-500" },
};

export default function ProfilePage() {
  const { currentUser, users, setCurrentUser, setUsers, posts } = useApp();
  const { userId } = useParams();
  const navigate = useNavigate();

  const profileUser = userId ? users.find(u => u.id === userId) : currentUser;
  const isOwn = !userId || userId === currentUser?.id;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profileUser?.displayName || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [avatarData, setAvatarData] = useState(profileUser?.avatar || "");
  const [bannerData, setBannerData] = useState(profileUser?.banner || "");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!profileUser) return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">
      Пользователь не найден
    </div>
  );

  const userPosts = posts.filter(p => p.userId === profileUser.id);
  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isBlocked = currentUser?.blocked.includes(profileUser.id);
  const accent = profileUser.nitro ? ACCENT_COLORS[profileUser.nitro.accentColor] : null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarData(await fileToDataUrl(file));
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerData(await fileToDataUrl(file));
  };

  const handleSave = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatar: avatarData || currentUser.avatar,
      banner: bannerData,
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
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
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
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
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Banner */}
      <div className="relative h-44">
        {profileUser.banner ? (
          <img src={profileUser.banner} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-secondary"
            style={accent ? { background: `linear-gradient(135deg, ${accent.hex}66, ${accent.hex}22)` } : undefined}
          />
        )}
        {isOwn && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
          >
            <Icon name="Camera" size={13} /> Изменить
          </button>
        )}
      </div>

      {/* Profile info block */}
      <div className="px-5 pb-4 border-b border-border">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="relative">
            <img
              src={profileUser.avatar || FALLBACK}
              alt={profileUser.displayName}
              className="w-24 h-24 rounded-full border-4 border-card object-cover bg-muted shadow-xl"
              style={accent ? { boxShadow: `0 0 0 4px hsl(var(--card)), 0 0 0 6px ${accent.hex}` } : undefined}
            />
            {isOwn && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="absolute bottom-1 right-1 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:opacity-90"
              >
                <Icon name="Camera" size={13} />
              </button>
            )}
          </div>

          {!editing && (
            <div className="flex gap-2 mt-14">
              {isOwn ? (
                <button
                  onClick={() => setEditing(true)}
                  className="border border-border text-foreground px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-secondary transition-all"
                >
                  Редактировать
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAddFriend}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                      ${isFriend
                        ? "border-border text-foreground hover:bg-secondary"
                        : "bg-foreground text-background hover:opacity-85"}`}
                  >
                    {isFriend ? "Друг ✓" : "Добавить"}
                  </button>
                  <button onClick={() => navigate(`/messages?with=${profileUser.id}`)} className="border border-border p-2 rounded-full hover:bg-secondary transition-all">
                    <Icon name="MessageCircle" size={16} />
                  </button>
                  <button onClick={handleBlock} className={`border p-2 rounded-full transition-all ${isBlocked ? "border-destructive text-destructive" : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"}`}>
                    <Icon name="Ban" size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            {/* Avatar upload */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Аватарка</label>
              <div className="flex items-center gap-3">
                <img src={avatarData || FALLBACK} className="w-14 h-14 rounded-full object-cover bg-muted border border-border" />
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                <button onClick={() => avatarInputRef.current?.click()} className="border border-dashed border-primary/60 text-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 flex items-center gap-2">
                  <Icon name="Upload" size={15} /> Загрузить
                </button>
              </div>
            </div>
            {/* Banner upload */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Баннер</label>
              <div className="flex items-center gap-3 flex-wrap">
                {bannerData && <img src={bannerData} className="w-28 h-14 rounded-lg object-cover border border-border" />}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
                <button onClick={() => bannerInputRef.current?.click()} className="border border-dashed border-primary/60 text-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 flex items-center gap-2">
                  <Icon name="Upload" size={15} /> Загрузить
                </button>
                {bannerData && <button onClick={() => setBannerData("")} className="text-xs text-muted-foreground hover:text-destructive">Удалить</button>}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Имя</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">О себе</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Расскажи о себе..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-bold hover:opacity-90">Сохранить</button>
              <button onClick={() => setEditing(false)} className="flex-1 border border-border py-2.5 rounded-full text-sm font-semibold hover:bg-secondary">Отмена</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black">{profileUser.displayName}</h2>
              {profileUser.isAdmin && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">Admin</span>}
              {profileUser.nitro?.badge && BADGE_LABELS[profileUser.nitro.badge] && (
                <span className={`bg-gradient-to-r ${BADGE_LABELS[profileUser.nitro.badge].color} text-white text-xs px-2 py-0.5 rounded-full font-bold`}>
                  {BADGE_LABELS[profileUser.nitro.badge].label}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">@{profileUser.username}</p>
            {profileUser.bio && <p className="text-sm mt-2 leading-relaxed">{profileUser.bio}</p>}
            <div className="flex items-center gap-5 mt-3 text-sm">
              <span className="text-muted-foreground"><strong className="text-foreground">{userPosts.length}</strong> постов</span>
              <span className="text-muted-foreground"><strong className="text-foreground">{profileUser.friends.length}</strong> друзей</span>
            </div>
          </>
        )}
      </div>

      {/* Posts grid */}
      {!editing && (
        <div className="px-4 pt-4">
          {userPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Image" size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Нет публикаций</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
              {userPosts.map(post => (
                <div key={post.id} className="aspect-square relative group cursor-pointer">
                  {post.image
                    ? <img src={post.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-secondary flex items-center justify-center"><Icon name="FileText" size={24} className="text-muted-foreground opacity-40" /></div>
                  }
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                    <span className="text-sm font-bold">❤️ {post.likes.length}</span>
                    <span className="text-sm font-bold">💬 {post.comments.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
