import { useState, useRef } from "react";
import { useApp, Post, Comment } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Все", "Аниме", "Фильмы", "Арт", "Природа", "Игры", "Спорт", "Музыка", "Другое"];

export default function FeedPage() {
  const { posts, setPosts, currentUser, addNotification } = useApp();
  const [activeCategory, setActiveCategory] = useState("Все");
  const [showNewPost, setShowNewPost] = useState(false);
  const navigate = useNavigate();

  const filtered = posts
    .filter(p => activeCategory === "Все" || p.category === activeCategory)
    .filter(p => !currentUser?.blocked.includes(p.userId))
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !currentUser) return;
    const liked = post.likes.includes(currentUser.id);
    setPosts((prev) => prev.map(p =>
      p.id === postId
        ? { ...p, likes: liked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] }
        : p
    ));
    // Only notify the post owner, not ourselves
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
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight">Лента</h1>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Icon name="Plus" size={16} />
          Пост
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-secondary text-secondary-foreground hover:bg-border"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="Image" size={48} className="mx-auto mb-3 opacity-30" />
            <p>Пока нет постов в этой категории</p>
          </div>
        )}
        {filtered.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            style={{ animationDelay: `${i * 0.05}s` }}
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
  const { currentUser, posts, setPosts, addNotification } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likeAnim, setLikeAnim] = useState(false);
  // Anti-spam for comments: 5 per 45 seconds
  const spamRef = useRef<number[]>([]);
  const [spamBlocked, setSpamBlocked] = useState(false);

  const liked = currentUser ? post.likes.includes(currentUser.id) : false;

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    onLike();
  };

  const handleComment = () => {
    if (!currentUser || !commentText.trim()) return;

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
      text: commentText.trim(),
      createdAt: now,
    };
    setPosts((prev) => prev.map(p =>
      p.id === post.id ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    // Only notify post owner, not self
    if (post.userId !== currentUser.id) {
      addNotification({
        type: "comment",
        fromUsername: currentUser.displayName,
        fromAvatar: currentUser.avatar,
        text: `прокомментировал(а) твоё фото: «${commentText.trim().slice(0, 40)}»`,
        targetUserId: post.userId,
      });
    }
    setCommentText("");
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "только что";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    return `${Math.floor(diff / 86400000)} д назад`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in" style={style}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <button onClick={onUserClick}>
          <img src={post.avatar} alt={post.displayName} className="w-10 h-10 rounded-full bg-muted hover-scale" />
        </button>
        <div className="flex-1">
          <button onClick={onUserClick} className="font-semibold text-sm hover:text-primary transition-colors">
            {post.displayName}
          </button>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">@{post.username}</p>
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
              {post.category}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
      </div>

      {/* Image */}
      <div className="relative">
        <img
          src={post.image}
          alt={post.caption}
          className="w-full object-cover max-h-[480px]"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-all ${likeAnim ? "heart-beat" : ""}`}
          >
            <Icon
              name="Heart"
              size={22}
              className={liked ? "text-red-500 fill-red-500" : "text-muted-foreground hover:text-red-400"}
            />
            <span className={`text-sm font-medium ${liked ? "text-red-500" : "text-muted-foreground"}`}>
              {post.likes.length}
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="MessageCircle" size={22} />
            <span className="text-sm font-medium">{post.comments.length}</span>
          </button>
        </div>

        {post.caption && (
          <p className="text-sm mt-2 leading-relaxed">
            <span className="font-semibold mr-1">{post.username}</span>
            {post.caption}
          </p>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border mt-3 pt-3 space-y-2 animate-fade-in">
          {post.comments.map(c => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold mr-1">{c.username}</span>
              <span className="text-foreground">{c.text}</span>
            </div>
          ))}
          {currentUser && (
            <div className="flex gap-2 mt-3">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleComment()}
                placeholder={spamBlocked ? "⏳ Подожди немного..." : "Комментарий..."}
                disabled={spamBlocked}
                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || spamBlocked}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-all"
              >
                <Icon name="Send" size={16} />
              </button>
            </div>
          )}
          {spamBlocked && (
            <p className="text-xs text-destructive animate-fade-in">Антиспам: подожди перед следующим комментарием (5/45 сек)</p>
          )}
        </div>
      )}
    </div>
  );
}

function NewPostModal({ onClose }: { onClose: () => void }) {
  const { currentUser, setPosts } = useApp();
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Другое");

  const handleSubmit = () => {
    if (!imageUrl.trim() || !currentUser) return;
    const newPost: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      image: imageUrl.trim(),
      caption: caption.trim(),
      category,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    };
    setPosts((prev) => [newPost, ...prev]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Новый пост</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Ссылка на фото</label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {imageUrl && (
            <img src={imageUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" onError={() => setImageUrl("")} />
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Категория</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CATEGORIES.filter(c => c !== "Все").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Подпись</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Расскажи о фото..."
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!imageUrl.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40"
          >
            Опубликовать
          </button>
        </div>
      </div>
    </div>
  );
}
