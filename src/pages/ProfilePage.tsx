import { useState, useRef, useCallback } from "react";
import { useApp, ACCENT_COLORS } from "@/App";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fileToDataUrl } from "@/lib/fileToDataUrl";

// Simple image cropper using canvas
function ImageCropper({
  src,
  aspect, // width/height ratio
  onCrop,
  onCancel,
}: {
  src: string;
  aspect: number;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Output size
  const outW = aspect >= 1 ? 600 : 300;
  const outH = Math.round(outW / aspect);
  // Preview container (always 320px wide)
  const prevW = 320;
  const prevH = Math.round(prevW / aspect);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setOffsetX(x => x + e.clientX - lastPos.current.x);
    setOffsetY(y => y + e.clientY - lastPos.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { dragging.current = false; };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    setOffsetX(x => x + e.touches[0].clientX - lastPos.current.x);
    setOffsetY(y => y + e.touches[0].clientY - lastPos.current.y);
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const doCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    // Scale factor: displayed image size vs original
    const dispW = img.naturalWidth * scale * (prevW / img.naturalWidth);
    const dispH = img.naturalHeight * scale * (prevW / img.naturalWidth);
    // top-left of image in preview coords
    const imgLeft = (prevW - dispW) / 2 + offsetX;
    const imgTop = (prevH - dispH) / 2 + offsetY;
    // Crop region in image coords
    const ratio = img.naturalWidth / dispW;
    const sx = (-imgLeft) * ratio;
    const sy = (-imgTop) * ratio;
    const sw = outW * ratio;
    const sh = outH * ratio;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    onCrop(canvas.toDataURL("image/jpeg", 0.88));
  }, [imgRef, scale, offsetX, offsetY, outW, outH, prevW, prevH, onCrop]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">Обрезать изображение</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-5">
          {/* Preview crop area */}
          <div
            className="relative overflow-hidden rounded-xl bg-checkered mx-auto cursor-grab active:cursor-grabbing select-none border-2 border-primary/40"
            style={{ width: prevW, height: prevH }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: `${prevW/3}px ${prevH/3}px`,
            }} />
          </div>

          {/* Scale slider */}
          <div className="mt-4 flex items-center gap-3">
            <Icon name="ZoomOut" size={16} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.02"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <Icon name="ZoomIn" size={16} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(scale * 100)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">Перетащи, чтобы изменить положение</p>

          <div className="flex gap-3 mt-5">
            <button onClick={onCancel} className="flex-1 border border-border py-2.5 rounded-full text-sm font-semibold hover:bg-secondary">
              Отмена
            </button>
            <button onClick={doCrop} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-bold hover:opacity-90">
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // Cropper state
  const [cropSrc, setCropSrc] = useState<string>("");
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);

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
    const url = await fileToDataUrl(file);
    setCropSrc(url);
    setCropTarget("avatar");
    e.target.value = "";
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setCropSrc(url);
    setCropTarget("banner");
    e.target.value = "";
  };

  const handleCropDone = (dataUrl: string) => {
    if (cropTarget === "avatar") setAvatarData(dataUrl);
    else if (cropTarget === "banner") setBannerData(dataUrl);
    setCropSrc("");
    setCropTarget(null);
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
      {/* Image Cropper Modal */}
      {cropSrc && cropTarget && (
        <ImageCropper
          src={cropSrc}
          aspect={cropTarget === "avatar" ? 1 : 600 / 176}
          onCrop={handleCropDone}
          onCancel={() => { setCropSrc(""); setCropTarget(null); }}
        />
      )}

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
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">
                Аватарка
                <span className="ml-2 normal-case text-primary font-normal">1:1 — обрезка по кругу</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={avatarData || FALLBACK} className="w-16 h-16 rounded-full object-cover bg-muted border-2 border-border" />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Icon name="Camera" size={18} className="text-white" />
                  </button>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                <div>
                  <button onClick={() => avatarInputRef.current?.click()} className="border border-dashed border-primary/60 text-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 flex items-center gap-2">
                    <Icon name="Upload" size={15} /> Загрузить и обрезать
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1">Откроется редактор для обрезки</p>
                </div>
              </div>
            </div>
            {/* Banner upload */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">
                Баннер
                <span className="ml-2 normal-case text-primary font-normal">3.4:1 — горизонтальный</span>
              </label>
              <div className="flex flex-col gap-2">
                {bannerData && (
                  <div className="relative">
                    <img src={bannerData} className="w-full h-20 rounded-xl object-cover border border-border" />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Icon name="Camera" size={20} className="text-white" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
                  <button onClick={() => bannerInputRef.current?.click()} className="border border-dashed border-primary/60 text-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 flex items-center gap-2">
                    <Icon name="Upload" size={15} /> Загрузить и обрезать
                  </button>
                  {bannerData && <button onClick={() => setBannerData("")} className="text-xs text-muted-foreground hover:text-destructive">Удалить</button>}
                </div>
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