import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  isAdmin: boolean;
  friends: string[];
  blocked: string[];
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
  text: string;
  createdAt: number;
  read: boolean;
};

type AppContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  users: User[];
  setUsers: (u: User[]) => void;
  posts: Post[];
  setPosts: (p: Post[]) => void;
  messages: Message[];
  setMessages: (m: Message[]) => void;
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("posts");
    return saved ? JSON.parse(saved) : DEMO_POSTS;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("messages");
    return saved ? JSON.parse(saved) : DEMO_MESSAGES;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
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

  const addNotification = (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString(),
      createdAt: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
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
