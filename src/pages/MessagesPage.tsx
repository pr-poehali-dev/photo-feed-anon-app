import { useState, useEffect, useRef } from "react";
import { useApp, Message } from "@/App";
import { fileToDataUrl } from "@/lib/fileToDataUrl";
import Icon from "@/components/ui/icon";
import { useSearchParams } from "react-router-dom";

export default function MessagesPage() {
  const { currentUser, users, messages, setMessages, addNotification } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("with"));
  const [text, setText] = useState("");
  const [spamCooldown, setSpamCooldown] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "active">("idle");
  const [recording, setRecording] = useState(false);
  const spamRef = useRef<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
          <div className="flex flex-col flex-1 relative">
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
              <button onClick={() => setSelectedUserId(null)} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <img src={selectedUser.avatar} alt={selectedUser.displayName} className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{selectedUser.displayName}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
              {/* Call buttons */}
              <button
                onClick={() => {
                  setCallStatus("calling");
                  setInCall(true);
                  setTimeout(() => setCallStatus("active"), 2000);
                }}
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all"
                title="Голосовой звонок"
              >
                <Icon name="Phone" size={18} />
              </button>
              <button
                onClick={() => {
                  setCallStatus("calling");
                  setInCall(true);
                  setTimeout(() => setCallStatus("active"), 2000);
                }}
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all"
                title="Видеозвонок"
              >
                <Icon name="Video" size={18} />
              </button>
            </div>

            {/* Call overlay */}
            {inCall && (
              <div className="absolute inset-0 bg-background/95 z-30 flex flex-col items-center justify-center gap-6 animate-fade-in">
                <img src={selectedUser.avatar} className="w-24 h-24 rounded-full border-4 border-primary shadow-2xl" />
                <div className="text-center">
                  <p className="text-xl font-black">{selectedUser.displayName}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {callStatus === "calling" ? "Вызов..." : "Соединено ✓"}
                  </p>
                  {callStatus === "active" && (
                    <p className="text-primary text-xs mt-0.5">🎤 Голосовой звонок активен</p>
                  )}
                </div>
                <button
                  onClick={() => { setInCall(false); setCallStatus("idle"); }}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
                >
                  <Icon name="PhoneOff" size={26} className="text-white" />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-10">Начни диалог!</p>
              )}
              {conversation.map(m => {
                const isMe = m.fromId === currentUser?.id;
                const isAudio = m.text.startsWith("data:audio");
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl text-sm overflow-hidden
                      ${isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                      }`}
                    >
                      {isAudio ? (
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <Icon name="Mic" size={16} className={isMe ? "text-primary-foreground/80" : "text-primary"} />
                          <audio src={m.text} controls className="h-8 max-w-[180px]" />
                        </div>
                      ) : (
                        <div className="px-4 py-2.5">
                          <p>{m.text}</p>
                        </div>
                      )}
                      <p className={`text-[10px] px-4 pb-1.5 ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
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
              <div className="flex gap-2 items-center">
                <button
                  onMouseDown={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      const mr = new MediaRecorder(stream);
                      chunksRef.current = [];
                      mr.ondataavailable = e => chunksRef.current.push(e.data);
                      mr.onstop = () => {
                        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                        const reader = new FileReader();
                        reader.onload = () => {
                          const audioData = reader.result as string;
                          const now = Date.now();
                          const newMsg: Message = {
                            id: now.toString() + Math.random(),
                            fromId: currentUser!.id,
                            toId: selectedUserId!,
                            text: audioData,
                            createdAt: now,
                            read: false,
                          };
                          setMessages(prev => [...(prev as Message[]), newMsg]);
                        };
                        reader.readAsDataURL(blob);
                        stream.getTracks().forEach(t => t.stop());
                      };
                      mr.start();
                      mediaRef.current = mr;
                      setRecording(true);
                    } catch { alert("Нет доступа к микрофону"); }
                  }}
                  onMouseUp={() => { mediaRef.current?.stop(); setRecording(false); }}
                  onMouseLeave={() => { if (recording) { mediaRef.current?.stop(); setRecording(false); } }}
                  className={`p-3 rounded-xl transition-all ${recording ? "bg-red-500 text-white animate-pulse" : "bg-secondary text-primary hover:bg-primary/10"}`}
                  title="Удерживай для записи голосового"
                >
                  <Icon name="Mic" size={18} />
                </button>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={spamCooldown ? "Подожди 5 секунд..." : recording ? "🎤 Запись..." : "Написать сообщение..."}
                  disabled={spamCooldown || recording}
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
          </div>
        )}
      </div>
    </div>
  );
}