import { useState, useRef } from "react";
import { useApp, Post, Comment } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";
import { fileToDataUrl } from "@/lib/fileToDataUrl";

export default function FeedPage() {
  const { posts, setPosts, currentUser, addNotification } = useApp();
  const [showNewPost, setShowNewPost] = useState(false);
  const navigate = useNavigate();

  const filtered = posts
    .filter(p => !currentUser?.blocked.includes(p.userId))
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !currentUser) return;
    const liked = post.likes.includes(currentUser.id);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes: liked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] }
        : p
    ));
    if (!liked && post.userId !== currentUser.id) {
      addNotification({
        type: "like",
        fromUsername: currentUser.displayName,
        fromAvatar: currentUser.avatar,
        text: "поставил(а) лайк твоей фотографии",
        targetUserId: post.userId,
      });
    }
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 py-4">
      {/* X-style header */}
      <div className="flex items-center justify-between py-3 mb-2 border-b border-border/50">
        <h1 className="text-xl font-black tracking-tight">Лента</h1>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <Icon name="Plus" size={16} />
          Опубликовать
        </button>
      </div>

      {/* New post inline teaser */}
      {currentUser && (
        <div
          className="flex items-center gap-3 py-4 border-b border-border/50 mb-2 cursor-pointer group"
          onClick={() => setShowNewPost(true)}
        >
          <img src={currentUser.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"} className="w-10 h-10 rounded-full object-cover bg-muted shrink-0" />
          <div className="flex-1 text-muted-foreground text-sm group-hover:text-foreground transition-colors py-2 px-4 bg-secondary/50 rounded-full">
            Что происходит?
          </div>
          <button className="p-2 rounded-full hover:bg-primary/10 transition-all">
            <Icon name="Image" size={20} className="text-primary" />
          </button>
        </div>
      )}

      {/* Posts feed */}
      <div className="divide-y divide-border/50">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="Image" size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Пока нет постов</p>
            <p className="text-sm mt-1">Будь первым — опубликуй что-нибудь!</p>
          </div>
        )}
        {filtered.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            style={{ animationDelay: `${i * 0.04}s` }}
            onLike={() => handleLike(post.id)}
            onUserClick={() => navigate(`/profile/${post.userId}`)}
          />
        ))}
      </div>

      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} />}
    </div>
  );
}

function PostCard({ post, style, onLike, onUserClick }: {
  post: Post;
  style?: React.CSSProperties;
  onLike: () => void;
  onUserClick: () => void;
}) {
  const { currentUser, setPosts, addNotification } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<string>("");
  const [likeAnim, setLikeAnim] = useState(false);
  const spamRef = useRef<number[]>([]);
  const [spamBlocked, setSpamBlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const liked = currentUser ? post.likes.includes(currentUser.id) : false;

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    onLike();
  };

  const handleCommentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setCommentImage(url);
  };

  const handleComment = () => {
    if (!currentUser || (!commentText.trim() && !commentImage)) return;

    const now = Date.now();
    spamRef.current = spamRef.current.filter(t => now - t < 45000);
    if (spamRef.current.length >= 5) {
      setSpamBlocked(true);
      setTimeout(() => setSpamBlocked(false), 5000);
      return;
    }
    spamRef.current.push(now);

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text: commentText.trim(),
      image: commentImage || undefined,
      createdAt: now,
    };
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    if (post.userId !== currentUser.id) {
      addNotification({
        type: "comment",
        fromUsername: currentUser.displayName,
        fromAvatar: currentUser.avatar,
        text: commentText
          ? `прокомментировал(а) твоё фото: «${commentText.slice(0, 40)}»`
          : "оставил(а) фото в комментарии",
        targetUserId: post.userId,
      });
    }
    setCommentText("");
    setCommentImage("");
  };

  const timeAgo = (ts: number) => {
    const d = Date.now() - ts;
    if (d < 60000) return "только что";
    if (d < 3600000) return `${Math.floor(d / 60000)} мин`;
    if (d < 86400000) return `${Math.floor(d / 3600000)} ч`;
    return `${Math.floor(d / 86400000)} д`;
  };

  return (
    <div className="py-4 animate-fade-in hover:bg-secondary/20 transition-colors px-1 rounded-xl" style={style}>
      <div className="flex gap-3">
        {/* Avatar column */}
        <button onClick={onUserClick} className="shrink-0">
          <img
            src={post.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"}
            alt={post.displayName}
            className="w-11 h-11 rounded-full object-cover bg-muted hover:opacity-90 transition-all ring-2 ring-transparent hover:ring-primary/30"
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button onClick={onUserClick} className="font-bold text-sm hover:underline">
              {post.displayName}
            </button>
            <span className="text-muted-foreground text-xs">@{post.username}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm leading-relaxed mb-3">{post.caption}</p>
          )}

          {/* Image */}
          {post.image && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-border/50">
              <img
                src={post.image}
                alt="post"
                className="w-full object-cover max-h-[520px]"
                onDoubleClick={handleLike}
              />
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-6 mt-1">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <span className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                <Icon name="MessageCircle" size={18} />
              </span>
              <span className="text-sm">{post.comments.length}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors group ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
            >
              <span className={`p-1.5 rounded-full group-hover:bg-red-500/10 transition-all ${likeAnim ? "heart-beat" : ""}`}>
                <Icon name="Heart" size={18} className={liked ? "fill-red-500" : ""} />
              </span>
              <span className="text-sm">{post.likes.length}</span>
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="mt-3 space-y-3 animate-fade-in border-t border-border/50 pt-3">
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <img src={c.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"} className="w-7 h-7 rounded-full object-cover bg-muted shrink-0 mt-0.5" />
                  <div className="flex-1 bg-secondary/60 rounded-2xl px-3 py-2">
                    <span className="font-semibold text-xs mr-1">{c.username}</span>
                    {c.text && <span className="text-sm">{c.text}</span>}
                    {c.image && (
                      <img src={c.image} className="mt-1.5 max-w-[200px] rounded-xl object-cover border border-border/50" />
                    )}
                  </div>
                </div>
              ))}

              {currentUser && (
                <div className="flex gap-2 items-end">
                  <img src={currentUser.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"} className="w-7 h-7 rounded-full object-cover bg-muted shrink-0" />
                  <div className="flex-1">
                    {commentImage && (
                      <div className="relative mb-1.5 inline-block">
                        <img src={commentImage} className="max-w-[120px] rounded-xl border border-border/50" />
                        <button onClick={() => setCommentImage("")} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
                        placeholder={spamBlocked ? "⏳ Подожди..." : "Комментарий..."}
                        disabled={spamBlocked}
                        className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      />
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCommentImage} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all"
                        title="Прикрепить фото"
                      >
                        <Icon name="Image" size={18} />
                      </button>
                      <button
                        onClick={handleComment}
                        disabled={(!commentText.trim() && !commentImage) || spamBlocked}
                        className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        <Icon name="Send" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewPostModal({ onClose }: { onClose: () => void }) {
  const { currentUser, setPosts } = useApp();
  const [imageData, setImageData] = useState("");
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioData, setAudioData] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const url = await fileToDataUrl(file);
    setImageData(url);
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => setAudioData(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      alert("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = () => {
    if (!currentUser) return;
    const newPost: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      image: audioData ? audioData : imageData,
      caption: caption.trim(),
      privacy,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    };
    setPosts(prev => [newPost, ...prev]);
    onClose();
  };

  const privacyOptions = [
    { value: "public",  label: "Все",       icon: "Globe" },
    { value: "friends", label: "Друзья",    icon: "Users" },
    { value: "private", label: "Только я",  icon: "Lock" },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition-all">
            <Icon name="X" size={20} />
          </button>

          {/* Privacy selector */}
          <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
            {privacyOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPrivacy(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${privacy === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon name={opt.icon} size={12} />
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!imageData && !caption.trim() && !audioData}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Опубликовать
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-3 p-5">
          <img
            src={currentUser?.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"}
            className="w-11 h-11 rounded-full object-cover bg-muted shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Что происходит?"
              rows={3}
              className="w-full bg-transparent text-lg outline-none resize-none placeholder:text-muted-foreground/60"
            />

            {imageData && !audioData && (
              <div className="relative mt-2">
                <img src={imageData} className="w-full max-h-64 object-cover rounded-2xl border border-border/50" />
                <button onClick={() => setImageData("")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/80">
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {audioData && (
              <div className="mt-2 flex items-center gap-3 bg-secondary/60 rounded-2xl px-4 py-3">
                <Icon name="Mic" size={18} className="text-primary" />
                <audio src={audioData} controls className="flex-1 h-8" />
                <button onClick={() => setAudioData("")} className="text-muted-foreground hover:text-destructive">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                <Icon name="Loader2" size={16} className="animate-spin" /> Загрузка...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all" title="Загрузить фото">
            <Icon name="Image" size={22} />
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-all ${recording ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-primary/10 text-primary"}`}
            title={recording ? "Остановить запись" : "Записать голосовое"}
          >
            <Icon name="Mic" size={22} />
          </button>
          {recording && (
            <span className="text-xs text-red-500 font-semibold animate-pulse">● Запись...</span>
          )}
        </div>
      </div>
    </div>
  );
}