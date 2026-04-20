import { useState, useEffect, useRef } from "react";
import { useApp, Message, GroupChat, VoiceChannel } from "@/App";
import Icon from "@/components/ui/icon";
import { useSearchParams, useNavigate } from "react-router-dom";

const FALLBACK = "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg";

type Tab = "dms" | "groups" | "voice";
type ChatTarget = { type: "dm"; userId: string } | { type: "group"; groupId: string };

export default function MessagesPage() {
  const { currentUser, users, messages, setMessages, addNotification, groupChats, setGroupChats, voiceChannels, setVoiceChannels } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("dms");
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(
    searchParams.get("with") ? { type: "dm", userId: searchParams.get("with")! } : null
  );
  const [text, setText] = useState("");
  const [spamCooldown, setSpamCooldown] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "active">("idle");
  const [recording, setRecording] = useState(false);
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateVoice, setShowCreateVoice] = useState(false);

  const spamRef = useRef<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // DM contacts
  const contacts = users.filter(u =>
    u.id !== currentUser?.id && !currentUser?.blocked.includes(u.id)
  );

  const getDmConversation = (userId: string) =>
    messages.filter(m =>
      (m.fromId === currentUser?.id && m.toId === userId) ||
      (m.fromId === userId && m.toId === currentUser?.id)
    ).sort((a, b) => a.createdAt - b.createdAt);

  const getGroupMessages = (groupId: string) =>
    messages.filter(m => m.toId === groupId).sort((a, b) => a.createdAt - b.createdAt);

  const getDmUnread = (userId: string) =>
    messages.filter(m => m.fromId === userId && m.toId === currentUser?.id && !m.read).length;

  const getDmLastMsg = (userId: string) => {
    const conv = getDmConversation(userId);
    return conv[conv.length - 1];
  };

  const getGroupLastMsg = (groupId: string) => {
    const msgs = getGroupMessages(groupId);
    return msgs[msgs.length - 1];
  };

  // My groups
  const myGroups = groupChats.filter(g => g.memberIds.includes(currentUser?.id || ""));

  useEffect(() => {
    if (chatTarget?.type === "dm") {
      setMessages(prev => (prev as Message[]).map(m =>
        m.fromId === chatTarget.userId && m.toId === currentUser?.id
          ? { ...m, read: true } : m
      ));
    }
  }, [chatTarget]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatTarget, messages.length]);

  const sendMessage = () => {
    if (!text.trim() || !currentUser || !chatTarget || spamCooldown) return;
    const now = Date.now();
    spamRef.current = spamRef.current.filter(t => now - t < 5000);
    if (spamRef.current.length >= 7) {
      setSpamCooldown(true);
      setTimeout(() => setSpamCooldown(false), 5000);
      return;
    }
    spamRef.current.push(now);

    const toId = chatTarget.type === "dm" ? chatTarget.userId : chatTarget.groupId;
    const newMsg: Message = {
      id: Date.now().toString() + Math.random(),
      fromId: currentUser.id,
      toId,
      text: text.trim(),
      createdAt: now,
      read: false,
    };
    setMessages(prev => [...(prev as Message[]), newMsg]);

    if (chatTarget.type === "dm") {
      addNotification({
        type: "message",
        fromUsername: currentUser.displayName,
        fromAvatar: currentUser.avatar,
        text: "написал(а) тебе сообщение",
        targetUserId: chatTarget.userId,
      });
    }
    setText("");
  };

  const sendAudio = (audioData: string) => {
    if (!currentUser || !chatTarget) return;
    const toId = chatTarget.type === "dm" ? chatTarget.userId : chatTarget.groupId;
    const newMsg: Message = {
      id: Date.now().toString() + Math.random(),
      fromId: currentUser.id,
      toId,
      text: audioData,
      createdAt: Date.now(),
      read: false,
    };
    setMessages(prev => [...(prev as Message[]), newMsg]);
  };

  const timeStr = (ts: number) =>
    new Date(ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

  const timeAgo = (ts: number) => {
    const d = Date.now() - ts;
    if (d < 60000) return "только что";
    if (d < 3600000) return `${Math.floor(d / 60000)} мин`;
    if (d < 86400000) return `${Math.floor(d / 3600000)} ч`;
    return `${Math.floor(d / 86400000)} д`;
  };

  // Get conversation for current chat
  const conversation = chatTarget
    ? chatTarget.type === "dm"
      ? getDmConversation(chatTarget.userId)
      : getGroupMessages(chatTarget.groupId)
    : [];

  const selectedUser = chatTarget?.type === "dm"
    ? users.find(u => u.id === chatTarget.userId)
    : null;

  const selectedGroup = chatTarget?.type === "group"
    ? groupChats.find(g => g.id === chatTarget.groupId)
    : null;

  const chatName = selectedUser?.displayName || selectedGroup?.name || "";
  const chatAvatar = selectedUser?.avatar || selectedGroup?.avatar || FALLBACK;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`${chatTarget ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border bg-card`}>
        {/* Tabs */}
        <div className="p-3 border-b border-border">
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            {([ ["dms","MessageCircle","Личные"], ["groups","Users","Группы"], ["voice","Mic","Голос"] ] as const).map(([t, icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all
                  ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon name={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* DMs */}
        {tab === "dms" && (
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">Нет контактов</p>
            ) : (
              contacts.map(user => {
                const last = getDmLastMsg(user.id);
                const unread = getDmUnread(user.id);
                const isActive = chatTarget?.type === "dm" && chatTarget.userId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => setChatTarget({ type: "dm", userId: user.id })}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-secondary transition-all text-left border-b border-border/50 ${isActive ? "bg-accent/30" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <img src={user.avatar || FALLBACK} className="w-11 h-11 rounded-full object-cover bg-muted" />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unread}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{user.displayName}</p>
                        {last && <span className="text-[11px] text-muted-foreground">{timeAgo(last.createdAt)}</span>}
                      </div>
                      {last && (
                        <p className={`text-xs truncate ${unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {last.fromId === currentUser?.id ? "Вы: " : ""}{last.text.startsWith("data:audio") ? "🎤 Голосовое" : last.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Groups */}
        {tab === "groups" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center gap-2 justify-center border border-dashed border-primary/50 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/10 transition-all"
              >
                <Icon name="Plus" size={16} /> Создать группу
              </button>
            </div>
            {myGroups.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Нет групп</p>
            ) : (
              myGroups.map(group => {
                const last = getGroupLastMsg(group.id);
                const isActive = chatTarget?.type === "group" && chatTarget.groupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setChatTarget({ type: "group", groupId: group.id })}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-secondary transition-all text-left border-b border-border/50 ${isActive ? "bg-accent/30" : ""}`}
                  >
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-xl shrink-0">
                      {group.avatar || "👥"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{group.name}</p>
                        {last && <span className="text-[11px] text-muted-foreground">{timeAgo(last.createdAt)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{group.memberIds.length} участников</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Voice channels */}
        {tab === "voice" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <button
                onClick={() => setShowCreateVoice(true)}
                className="w-full flex items-center gap-2 justify-center border border-dashed border-primary/50 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/10 transition-all"
              >
                <Icon name="Plus" size={16} /> Создать канал
              </button>
            </div>
            {voiceChannels.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Нет каналов</p>
            ) : (
              <div className="px-2 space-y-1">
                {voiceChannels.map(ch => {
                  const isIn = ch.participants.includes(currentUser?.id || "");
                  const isActive = activeVoiceChannelId === ch.id;
                  return (
                    <div key={ch.id} className={`rounded-xl p-3 transition-all ${isActive ? "bg-green-500/10 border border-green-500/30" : "hover:bg-secondary"}`}>
                      <div className="flex items-center gap-2">
                        <Icon name="Volume2" size={16} className={isActive ? "text-green-500" : "text-muted-foreground"} />
                        <span className="font-semibold text-sm flex-1">{ch.name}</span>
                        {isActive ? (
                          <button
                            onClick={() => {
                              setVoiceChannels(prev => (prev as VoiceChannel[]).map(c =>
                                c.id === ch.id
                                  ? { ...c, participants: c.participants.filter(id => id !== currentUser?.id) }
                                  : c
                              ));
                              setActiveVoiceChannelId(null);
                            }}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg"
                          >
                            Выйти
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setVoiceChannels(prev => (prev as VoiceChannel[]).map(c =>
                                c.id === ch.id
                                  ? { ...c, participants: [...c.participants.filter(id => id !== currentUser?.id), currentUser!.id] }
                                  : c
                              ));
                              setActiveVoiceChannelId(ch.id);
                            }}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg hover:opacity-90"
                          >
                            Войти
                          </button>
                        )}
                        {ch.createdBy === currentUser?.id && (
                          <button
                            onClick={() => setVoiceChannels(prev => (prev as VoiceChannel[]).filter(c => c.id !== ch.id))}
                            className="text-muted-foreground hover:text-destructive ml-1"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        )}
                      </div>
                      {ch.participants.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 ml-6">
                          {ch.participants.map(pid => {
                            const u = users.find(u => u.id === pid);
                            return u ? (
                              <div key={pid} className="flex items-center gap-1">
                                <img src={u.avatar || FALLBACK} className="w-5 h-5 rounded-full" />
                                <span className="text-[11px] text-muted-foreground">{u.username}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`${chatTarget ? "flex" : "hidden md:flex"} flex-col flex-1 relative`}>
        {!chatTarget ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Выбери диалог</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card shrink-0">
              <button onClick={() => setChatTarget(null)} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div className="relative">
                {chatTarget.type === "group" ? (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">{selectedGroup?.avatar || "👥"}</div>
                ) : (
                  <img src={chatAvatar} className="w-10 h-10 rounded-full object-cover bg-muted" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{chatName}</p>
                <p className="text-xs text-muted-foreground">
                  {chatTarget.type === "group"
                    ? `${selectedGroup?.memberIds.length} участников`
                    : `@${selectedUser?.username}`}
                </p>
              </div>
              {chatTarget.type === "dm" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => { setCallStatus("calling"); setInCall(true); setTimeout(() => setCallStatus("active"), 2000); }}
                    className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all"
                    title="Голосовой звонок"
                  >
                    <Icon name="Phone" size={18} />
                  </button>
                  <button
                    onClick={() => { setCallStatus("calling"); setInCall(true); setTimeout(() => setCallStatus("active"), 2000); }}
                    className="p-2 rounded-full hover:bg-primary/10 text-primary transition-all"
                    title="Видеозвонок"
                  >
                    <Icon name="Video" size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Call overlay */}
            {inCall && selectedUser && (
              <div className="absolute inset-0 bg-background/95 z-30 flex flex-col items-center justify-center gap-6 animate-fade-in">
                <img src={selectedUser.avatar || FALLBACK} className="w-24 h-24 rounded-full border-4 border-primary shadow-2xl" />
                <div className="text-center">
                  <p className="text-xl font-black">{selectedUser.displayName}</p>
                  <p className="text-muted-foreground text-sm mt-1">{callStatus === "calling" ? "Вызов..." : "Соединено ✓"}</p>
                </div>
                <button
                  onClick={() => { setInCall(false); setCallStatus("idle"); }}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all"
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
                const sender = users.find(u => u.id === m.fromId);
                return (
                  <div key={m.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && chatTarget.type === "group" && (
                      <img src={sender?.avatar || FALLBACK} className="w-7 h-7 rounded-full shrink-0 mt-1 object-cover" />
                    )}
                    <div className="max-w-[70%]">
                      {!isMe && chatTarget.type === "group" && (
                        <p className="text-[11px] text-muted-foreground mb-0.5 ml-1">{sender?.displayName}</p>
                      )}
                      <div className={`rounded-2xl text-sm overflow-hidden
                        ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}
                      >
                        {isAudio ? (
                          <div className="px-3 py-2.5 flex items-center gap-2">
                            <Icon name="Mic" size={15} className={isMe ? "text-primary-foreground/80" : "text-primary"} />
                            <audio src={m.text} controls className="h-8 max-w-[180px]" />
                          </div>
                        ) : (
                          <div className="px-4 py-2.5"><p>{m.text}</p></div>
                        )}
                        <p className={`text-[10px] px-4 pb-1.5 ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                          {timeStr(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              {spamCooldown && (
                <p className="text-xs text-destructive mb-2 text-center animate-fade-in">⏳ Слишком много сообщений — подожди 5 секунд</p>
              )}
              <div className="flex gap-2 items-center">
                {/* Voice record button */}
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
                        reader.onload = () => sendAudio(reader.result as string);
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
                  className={`p-3 rounded-xl transition-all shrink-0 ${recording ? "bg-red-500 text-white animate-pulse" : "bg-secondary text-primary hover:bg-primary/10"}`}
                  title="Удерживай для записи"
                >
                  <Icon name="Mic" size={18} />
                </button>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={spamCooldown ? "Подожди..." : recording ? "🎤 Запись..." : "Написать..."}
                  disabled={spamCooldown || recording}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || spamCooldown}
                  className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 disabled:opacity-40 shrink-0"
                >
                  <Icon name="Send" size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            setGroupChats(prev => [...(prev as GroupChat[]), group]);
            setChatTarget({ type: "group", groupId: group.id });
            setTab("groups");
            setShowCreateGroup(false);
          }}
        />
      )}

      {/* Create Voice Channel Modal */}
      {showCreateVoice && (
        <CreateVoiceModal
          onClose={() => setShowCreateVoice(false)}
          onCreated={(ch) => {
            setVoiceChannels(prev => [...(prev as VoiceChannel[]), ch]);
            setShowCreateVoice(false);
          }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (g: GroupChat) => void;
}) {
  const { currentUser, users } = useApp();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  const contacts = users.filter(u => u.id !== currentUser?.id && !currentUser?.blocked.includes(u.id));
  const EMOJIS = ["👥","🎮","🎵","🎬","📸","🌙","🔥","⚡","🌸","💬","🏆","🎯"];

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = () => {
    if (!name.trim()) { setError("Введи название группы"); return; }
    if (selected.length < 1) { setError("Добавь хотя бы одного участника"); return; }
    if (!currentUser) return;
    const group: GroupChat = {
      id: Date.now().toString(),
      name: name.trim(),
      avatar: emoji,
      memberIds: [currentUser.id, ...selected],
      createdBy: currentUser.id,
      createdAt: Date.now(),
    };
    onCreated(group);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold">Создать группу</h2>
          <button onClick={onClose}><Icon name="X" size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Значок группы</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-9 h-9 text-xl rounded-xl transition-all ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-secondary"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Название</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="Название группы..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">
              Участники ({selected.length} выбрано)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет контактов</p>
              ) : (
                contacts.map(u => (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                      ${selected.includes(u.id) ? "bg-primary/15 border border-primary/40" : "hover:bg-secondary border border-transparent"}`}
                  >
                    <img src={u.avatar || "https://cdn.poehali.dev/files/48ece15d-d73e-43d2-adcb-28d8dd569f2d.jpg"} className="w-9 h-9 rounded-full object-cover bg-muted" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    {selected.includes(u.id) && (
                      <Icon name="CheckCircle" size={18} className="text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            onClick={handleCreate}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all"
          >
            Создать группу
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateVoiceModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (ch: VoiceChannel) => void;
}) {
  const { currentUser } = useApp();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !currentUser) return;
    const ch: VoiceChannel = {
      id: Date.now().toString(),
      name: name.trim(),
      createdBy: currentUser.id,
      createdAt: Date.now(),
      participants: [],
    };
    onCreated(ch);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold flex items-center gap-2">
            <Icon name="Volume2" size={18} className="text-primary" />
            Голосовой канал
          </h2>
          <button onClick={onClose}><Icon name="X" size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Название канала</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Например: Игровой, Общий..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <p className="text-xs text-muted-foreground">Любой пользователь сможет зайти и выйти из канала</p>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Создать канал
          </button>
        </div>
      </div>
    </div>
  );
}
