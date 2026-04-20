import { useState, useEffect, useRef } from "react";
import { useApp, Message } from "@/App";
import Icon from "@/components/ui/icon";
import { useSearchParams } from "react-router-dom";

export default function MessagesPage() {
  const { currentUser, users, messages, setMessages, addNotification } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("with"));
  const [text, setText] = useState("");
  const [spamCooldown, setSpamCooldown] = useState(false);
  const spamRef = useRef<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const contacts = users.filter(u =>
    u.id !== currentUser?.id &&
    !currentUser?.blocked.includes(u.id)
  );

  const getConversation = (userId: string) =>
    messages.filter(m =>
      (m.fromId === currentUser?.id && m.toId === userId) ||
      (m.fromId === userId && m.toId === currentUser?.id)
    ).sort((a, b) => a.createdAt - b.createdAt);

  const getUnreadCount = (userId: string) =>
    messages.filter(m => m.fromId === userId && m.toId === currentUser?.id && !m.read).length;

  const getLastMessage = (userId: string) => {
    const conv = getConversation(userId);
    return conv[conv.length - 1];
  };

  useEffect(() => {
    if (selectedUserId) {
      setMessages((prev) => (prev as Message[]).map(m =>
        m.fromId === selectedUserId && m.toId === currentUser?.id
          ? { ...m, read: true }
          : m
      ));
    }
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUserId, messages.length]);

  const sendMessage = () => {
    if (!text.trim() || !currentUser || !selectedUserId || spamCooldown) return;

    const now = Date.now();
    // Anti-spam: max 7 messages per 5 seconds → 5 sec cooldown
    spamRef.current = spamRef.current.filter(t => now - t < 5000);
    if (spamRef.current.length >= 7) {
      setSpamCooldown(true);
      setTimeout(() => setSpamCooldown(false), 5000);
      return;
    }
    spamRef.current.push(now);

    const newMsg: Message = {
      id: Date.now().toString() + Math.random(),
      fromId: currentUser.id,
      toId: selectedUserId,
      text: text.trim(),
      createdAt: now,
      read: false,
    };
    setMessages((prev) => [...(prev as Message[]), newMsg]);

    // Notify recipient (not yourself)
    addNotification({
      type: "message",
      fromUsername: currentUser.displayName,
      fromAvatar: currentUser.avatar,
      text: `написал(а) тебе сообщение`,
      targetUserId: selectedUserId,
    });
    setText("");
  };

  const timeStr = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const conversation = selectedUserId ? getConversation(selectedUserId) : [];

  return (
    <div className="flex h-screen">
      {/* Contacts list */}
      <div className={`${selectedUserId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border bg-card`}>
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-lg">Сообщения</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-10">Нет контактов</p>
          )}
          {contacts.map(user => {
            const last = getLastMessage(user.id);
            const unread = getUnreadCount(user.id);
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-secondary transition-all text-left border-b border-border/50
                  ${selectedUserId === user.id ? "bg-accent/40" : ""}`}
              >
                <div className="relative shrink-0">
                  <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full bg-muted" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{user.displayName}</p>
                    {last && <span className="text-xs text-muted-foreground">{timeStr(last.createdAt)}</span>}
                  </div>
                  {last && (
                    <p className={`text-xs truncate ${unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {last.fromId === currentUser?.id ? "Вы: " : ""}{last.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${selectedUserId ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Выбери диалог</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
              <button onClick={() => setSelectedUserId(null)} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <img src={selectedUser.avatar} alt={selectedUser.displayName} className="w-10 h-10 rounded-full bg-muted" />
              <div>
                <p className="font-semibold text-sm">{selectedUser.displayName}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-10">Начни диалог!</p>
              )}
              {conversation.map(m => {
                const isMe = m.fromId === currentUser?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                      ${isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                        {timeStr(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              {spamCooldown && (
                <p className="text-xs text-destructive mb-2 text-center animate-fade-in">
                  ⏳ Слишком много сообщений — подожди 5 секунд
                </p>
              )}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={spamCooldown ? "Подожди 5 секунд..." : "Написать сообщение..."}
                  disabled={spamCooldown}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || spamCooldown}
                  className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                >
                  <Icon name="Send" size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
