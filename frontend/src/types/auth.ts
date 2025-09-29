export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  role: 'Admin' | 'Librarian' | 'Member';
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  getAuthToken: () => string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}