import { useState } from "react";
import { useApp } from "@/App";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function ProfilePage() {
  const { currentUser, users, setCurrentUser, setUsers, posts, currentUser: cu } = useApp();
  const { userId } = useParams();
  const navigate = useNavigate();

  const profileUser = userId ? users.find(u => u.id === userId) : currentUser;
  const isOwn = !userId || userId === currentUser?.id;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profileUser?.displayName || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [avatarSeed, setAvatarSeed] = useState(profileUser?.username || "");

  if (!profileUser) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Пользователь не найден</p>
    </div>
  );

  const userPosts = posts.filter(p => p.userId === profileUser.id);
  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isBlocked = currentUser?.blocked.includes(profileUser.id);

  const handleSave = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed || currentUser.username}`,
    };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
    setEditing(false);
  };

  const handleAddFriend = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, friends: isFriend
      ? currentUser.friends.filter(id => id !== profileUser.id)
      : [...currentUser.friends, profileUser.id]
    };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  const handleBlock = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, blocked: isBlocked
      ? currentUser.blocked.filter(id => id !== profileUser.id)
      : [...currentUser.blocked, profileUser.id]
    };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <img
            src={profileUser.avatar}
            alt={profileUser.displayName}
            className="w-20 h-20 rounded-2xl bg-muted object-cover shadow-lg"
          />
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Имя"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="О себе..."
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={avatarSeed}
                  onChange={e => setAvatarSeed(e.target.value)}
                  placeholder="Стиль аватара (любое слово)"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:opacity-90">
                    Сохранить
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-border">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-lg">{profileUser.displayName}</h2>
                  {profileUser.isAdmin && (
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">Admin</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">@{profileUser.username}</p>
                {profileUser.bio && <p className="text-sm mt-2">{profileUser.bio}</p>}

                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span><strong>{userPosts.length}</strong> <span className="text-muted-foreground">постов</span></span>
                  <span><strong>{profileUser.friends.length}</strong> <span className="text-muted-foreground">друзей</span></span>
                </div>

                <div className="flex gap-2 mt-4">
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                          ${isFriend ? "bg-secondary text-secondary-foreground hover:bg-border" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                      >
                        <Icon name={isFriend ? "UserMinus" : "UserPlus"} size={14} />
                        {isFriend ? "Удалить" : "Добавить"}
                      </button>
                      <button
                        onClick={() => navigate(`/messages?with=${profileUser.id}`)}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-border transition-all"
                      >
                        <Icon name="MessageCircle" size={14} />
                        Написать
                      </button>
                      <button
                        onClick={handleBlock}
                        className={`p-2 rounded-xl text-sm transition-all ${isBlocked ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}`}
                      >
                        <Icon name="Ban" size={16} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts grid */}
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
    </div>
  );
}
