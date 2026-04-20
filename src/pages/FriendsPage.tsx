import { useApp } from "@/App";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

export default function FriendsPage() {
  const { currentUser, users, setCurrentUser, setUsers, addNotification } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const friends = users.filter(u => currentUser.friends.includes(u.id));
  const suggestions = users.filter(
    u => u.id !== currentUser.id &&
      !currentUser.friends.includes(u.id) &&
      !currentUser.blocked.includes(u.id)
  );

  const handleAdd = (userId: string) => {
    const updated = { ...currentUser, friends: [...currentUser.friends, userId] };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
    addNotification({
      type: "friend",
      fromUsername: currentUser.username,
      text: "добавил(а) тебя в друзья",
    });
  };

  const handleRemove = (userId: string) => {
    const updated = { ...currentUser, friends: currentUser.friends.filter(id => id !== userId) };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black tracking-tight mb-6">Друзья</h1>

      {/* Friends */}
      <div className="mb-8">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Icon name="Users" size={18} />
          Мои друзья
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{friends.length}</span>
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl">
            <Icon name="UserX" size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Нет друзей. Добавь кого-нибудь!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map(user => (
              <div key={user.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 animate-fade-in">
                <button onClick={() => navigate(`/profile/${user.id}`)}>
                  <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted hover-scale" />
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/messages?with=${user.id}`)}
                    className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Icon name="MessageCircle" size={16} />
                  </button>
                  <button
                    onClick={() => handleRemove(user.id)}
                    className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                  >
                    <Icon name="UserMinus" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Icon name="UserPlus" size={18} />
            Возможно знаешь
          </h2>
          <div className="space-y-3">
            {suggestions.map(user => (
              <div key={user.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 animate-fade-in">
                <button onClick={() => navigate(`/profile/${user.id}`)}>
                  <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted hover-scale" />
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  {user.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
                </div>
                <button
                  onClick={() => handleAdd(user.id)}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Icon name="UserPlus" size={14} />
                  Добавить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
