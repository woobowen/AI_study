import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('token');
  if (rawToken === 'undefined' || rawToken === 'null' || rawToken === '') {
    return null;
  }
  return rawToken;
};

const getInitialUsername = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('username');
};

export const useAuthStore = create<AuthState>((set) => {
  const token = getInitialToken();
  const username = getInitialUsername();

  return {
    token,
    isAuthenticated: !!token,
    username,
    login: (nextToken, nextUsername) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', nextToken);
        localStorage.setItem('username', nextUsername);
      }
      set({
        token: nextToken,
        username: nextUsername,
        isAuthenticated: true,
      });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
      set({
        token: null,
        username: null,
        isAuthenticated: false,
      });
    },
  };
});
