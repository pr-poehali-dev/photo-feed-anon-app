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

export type BanInfo = {
  until: number; // timestamp
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
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  image: string;
  caption: string;
  category: string;
  likes: string[];
  comments: Comment[];
  createdAt: number;
};

export type Comment = {
  id: string;
  userId: string;
  username: string;
  text: string;
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
  targetUserId: string; // who should receive this notification
  createdAt: number;
  read: boolean;
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

const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "artem_space",
    displayName: "Артём Космонавт",
    bio: "Люблю фотографировать звёзды 🌌",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=artem",
    banner: "",
    isAdmin: false,
    friends: ["2", "3"],
    blocked: [],
  },
  {
    id: "2",
    username: "masha_photo",
    displayName: "Маша Фото",
    bio: "Аниме и фильмы — моя жизнь 🎌",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=masha",
    banner: "",
    isAdmin: false,
    friends: ["1"],
    blocked: [],
  },
  {
    id: "3",
    username: "kolya_films",
    displayName: "Коля Режиссёр",
    bio: "Кино — это всё 🎬",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kolya",
    banner: "",
    isAdmin: false,
    friends: ["1"],
    blocked: [],
  },
];

const DEMO_POSTS: Post[] = [
  {
    id: "p1",
    userId: "2",
    username: "masha_photo",
    displayName: "Маша Фото",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=masha",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    caption: "Мой любимый аниме-персонаж всех времён 🌸",
    category: "Аниме",
    likes: ["1"],
    comments: [
      { id: "c1", userId: "3", username: "kolya_films", text: "Крутое фото!", createdAt: Date.now() - 3600000 },
    ],
    createdAt: Date.now() - 7200000,
  },
  {
    id: "p2",
    userId: "3",
    username: "kolya_films",
    displayName: "Коля Режиссёр",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kolya",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    caption: "Вечер в кино — лучший отдых 🎬",
    category: "Фильмы",
    likes: ["1", "2"],
    comments: [],
    createdAt: Date.now() - 14400000,
  },
  {
    id: "p3",
    userId: "2",
    username: "masha_photo",
    displayName: "Маша Фото",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=masha",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80",
    caption: "Street art always hits different 🎨",
    category: "Арт",
    likes: [],
    comments: [],
    createdAt: Date.now() - 86400000,
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: "m1",
    fromId: "2",
    toId: "1",
    text: "Привет! Видел мои новые фото?",
    createdAt: Date.now() - 3600000,
    read: false,
  },
  {
    id: "m2",
    fromId: "3",
    toId: "1",
    text: "Когда следующая встреча?",
    createdAt: Date.now() - 7200000,
    read: true,
  },
];

function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsersState] = useState<User[]>(() => {
    const saved = localStorage.getItem("users");
    if (saved) {
      // ensure banner field exists
      const parsed = JSON.parse(saved) as User[];
      return parsed.map(u => ({ banner: "", ...u }));
    }
    return DEMO_USERS;
  });
  const [posts, setPostsState] = useState<Post[]>(() => {
    const saved = localStorage.getItem("posts");
    return saved ? JSON.parse(saved) : DEMO_POSTS;
  });
  const [messages, setMessagesState] = useState<Message[]>(() => {
    const saved = localStorage.getItem("messages");
    return saved ? JSON.parse(saved) : DEMO_MESSAGES;
  });
  const [notifications, setNotificationsState] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  const setCurrentUser = (u: User | null) => {
    setCurrentUserState(u);
  };

  const setUsers = (u: User[] | ((prev: User[]) => User[])) => {
    setUsersState(u);
  };

  const setPosts = (p: Post[] | ((prev: Post[]) => Post[])) => {
    setPostsState(p);
  };

  const setMessages = (m: Message[] | ((prev: Message[]) => Message[])) => {
    setMessagesState(m);
  };

  const setNotifications = (n: Notification[] | ((prev: Notification[]) => Notification[])) => {
    setNotificationsState(n);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  useEffect(() => { localStorage.setItem("users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("posts", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem("messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("notifications", JSON.stringify(notifications)); }, [notifications]);

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
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString() + Math.random(),
      createdAt: Date.now(),
      read: false,
    };
    setNotificationsState(prev => [newNotif, ...prev.slice(0, 99)]);
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
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  // Check if user is banned
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
