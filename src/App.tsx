import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import MainLayout from "./components/MainLayout";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import MessagesPage from "./pages/MessagesPage";
import FriendsPage from "./pages/FriendsPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export type Theme = "dark" | "light";

export type AccentColor = "purple" | "blue" | "pink" | "green" | "orange" | "red" | "gold";

export type NitroProfile = {
  accentColor: AccentColor;
  profileEffect?: string; // css class or gradient name
  animatedBanner?: boolean;
  badge?: "nitro" | "boost" | "dev" | "mod";
};

export type BanInfo = {
  until: number;
  reason: string;
};

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  isAdmin: boolean;
  friends: string[];
  blocked: string[];
  ban?: BanInfo;
  nitro?: NitroProfile;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  image: string;
  caption: string;
  privacy: "public" | "friends" | "private";
  likes: string[];
  comments: Comment[];
  createdAt: number;
};

export type Comment = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  image?: string;
  createdAt: number;
};

export type Message = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: number;
  read: boolean;
};

export type Notification = {
  id: string;
  type: "like" | "comment" | "message" | "friend";
  fromUsername: string;
  fromAvatar?: string;
  text: string;
  targetUserId: string;
  createdAt: number;
  read: boolean;
};

export const ACCENT_COLORS: Record<AccentColor, { label: string; css: string; hex: string }> = {
  purple: { label: "Фиолетовый", css: "265 85% 58%", hex: "#8b5cf6" },
  blue:   { label: "Синий",      css: "217 91% 60%", hex: "#3b82f6" },
  pink:   { label: "Розовый",    css: "330 81% 60%", hex: "#ec4899" },
  green:  { label: "Зелёный",    css: "142 71% 45%", hex: "#22c55e" },
  orange: { label: "Оранжевый",  css: "25 95% 53%",  hex: "#f97316" },
  red:    { label: "Красный",    css: "0 84% 60%",   hex: "#ef4444" },
  gold:   { label: "Золотой",    css: "43 96% 56%",  hex: "#eab308" },
};

type AppContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  users: User[];
  setUsers: (u: User[] | ((prev: User[]) => User[])) => void;
  posts: Post[];
  setPosts: (p: Post[] | ((prev: Post[]) => Post[])) => void;
  messages: Message[];
  setMessages: (m: Message[] | ((prev: Message[]) => Message[])) => void;
  notifications: Notification[];
  setNotifications: (n: Notification[] | ((prev: Notification[]) => Notification[])) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

// Start with clean data — no AI users, no AI posts/friends
const EMPTY_USERS: User[] = [];
const EMPTY_POSTS: Post[] = [];
const EMPTY_MESSAGES: Message[] = [];

function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem("theme") as Theme) || "dark"
  );
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsersState] = useState<User[]>(() => {
    const saved = localStorage.getItem("users_v2");
    return saved ? JSON.parse(saved) : EMPTY_USERS;
  });
  const [posts, setPostsState] = useState<Post[]>(() => {
    const saved = localStorage.getItem("posts_v2");
    return saved ? JSON.parse(saved) : EMPTY_POSTS;
  });
  const [messages, setMessagesState] = useState<Message[]>(() => {
    const saved = localStorage.getItem("messages_v2");
    return saved ? JSON.parse(saved) : EMPTY_MESSAGES;
  });
  const [notifications, setNotificationsState] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications_v2");
    return saved ? JSON.parse(saved) : [];
  });

  const setTheme = (t: Theme) => { setThemeState(t); localStorage.setItem("theme", t); };
  const setCurrentUser = (u: User | null) => setCurrentUserState(u);
  const setUsers = (u: User[] | ((prev: User[]) => User[])) => setUsersState(u);
  const setPosts = (p: Post[] | ((prev: Post[]) => Post[])) => setPostsState(p);
  const setMessages = (m: Message[] | ((prev: Message[]) => Message[])) => setMessagesState(m);
  const setNotifications = (n: Notification[] | ((prev: Notification[]) => Notification[])) => setNotificationsState(n);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Apply accent color from nitro profile
  useEffect(() => {
    const accent = currentUser?.nitro?.accentColor || "purple";
    const color = ACCENT_COLORS[accent];
    document.documentElement.style.setProperty("--primary", color.css);
    const isDark = theme === "dark";
    document.documentElement.style.setProperty("--primary-dark", isDark ? `${color.css.split(" ")[0]} ${color.css.split(" ")[1]} ${parseInt(color.css.split(" ")[2]) + 7}%` : color.css);
  }, [currentUser?.nitro?.accentColor, theme]);

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  // Heartbeat: пишем время активности текущего пользователя
  useEffect(() => {
    if (!currentUser) return;
    const writeHb = () => {
      try {
        const beats = JSON.parse(localStorage.getItem("online_heartbeats") || "{}");
        beats[currentUser.id] = Date.now();
        localStorage.setItem("online_heartbeats", JSON.stringify(beats));
      } catch { /* ignore */ }
    };
    writeHb();
    const iv = setInterval(writeHb, 30_000);
    return () => {
      clearInterval(iv);
      try {
        const beats = JSON.parse(localStorage.getItem("online_heartbeats") || "{}");
        delete beats[currentUser.id];
        localStorage.setItem("online_heartbeats", JSON.stringify(beats));
      } catch { /* ignore */ }
    };
  }, [currentUser?.id]);

  useEffect(() => { localStorage.setItem("users_v2", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("posts_v2", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem("messages_v2", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("notifications_v2", JSON.stringify(notifications)); }, [notifications]);

  // Sync currentUser with users list
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUserState(fresh);
      }
    }
  }, [users]);

  const addNotification = (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotificationsState(prev => [{
      ...n,
      id: Date.now().toString() + Math.random(),
      createdAt: Date.now(),
      read: false,
    }, ...(prev as Notification[]).slice(0, 99)]);
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      currentUser, setCurrentUser,
      users, setUsers,
      posts, setPosts,
      messages, setMessages,
      notifications, setNotifications,
      addNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function AppRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Routes><Route path="*" element={<AuthPage />} /></Routes>;
  }

  if (currentUser.ban && currentUser.ban.until > Date.now()) {
    const remaining = Math.ceil((currentUser.ban.until - Date.now()) / 60000);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-black mb-2">Аккаунт заблокирован</h1>
          <p className="text-muted-foreground mb-2">Причина: {currentUser.ban.reason}</p>
          <p className="text-sm text-muted-foreground">Осталось: {remaining} мин</p>
          <button
            onClick={() => { localStorage.removeItem("currentUser"); window.location.reload(); }}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;