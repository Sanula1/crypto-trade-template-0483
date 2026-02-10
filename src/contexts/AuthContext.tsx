import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

const BASE_URL = "https://lmsapi.suraksha.lk";

interface User {
  id: string;
  email: string;
  nameWithInitials?: string;
  firstName?: string;
  lastName?: string;
  userType: string;
  imageUrl: string | null;
}

interface SessionInfo {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number; // seconds
  refreshExpiresIn: number | null;
  expiresAt: number; // timestamp ms
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  sessionInfo: SessionInfo | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseExpiresIn(expiresIn: number): number {
  // expiresIn is in seconds from API
  return Date.now() + expiresIn * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setSessionInfo(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("session_info");
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback((session: SessionInfo) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh 60 seconds before expiry, or at half-life if less than 2 min
    const timeUntilExpiry = session.expiresAt - Date.now();
    const refreshDelay = Math.max(timeUntilExpiry - 60_000, timeUntilExpiry / 2, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          await doRefresh(session.refreshToken);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, refreshDelay);
  }, []);

  const saveSession = useCallback((userData: User, session: SessionInfo) => {
    setUser(userData);
    setSessionInfo(session);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("session_info", JSON.stringify(session));
    scheduleTokenRefresh(session);
  }, [scheduleTokenRefresh]);

  const doRefresh = useCallback(async (refreshToken: string | null): Promise<boolean> => {
    try {
      const body: Record<string, string> = {};
      if (refreshToken) body.refresh_token = refreshToken;

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        clearSession();
        return false;
      }

      const data = await response.json();

      if (data.access_token) {
        const userData: User = {
          id: data.user?.id || user?.id || "",
          email: data.user?.email || user?.email || "",
          nameWithInitials: data.user?.nameWithInitials || user?.nameWithInitials,
          firstName: data.user?.firstName || user?.firstName,
          lastName: data.user?.lastName || user?.lastName,
          userType: data.user?.userType || user?.userType || "",
          imageUrl: data.user?.imageUrl || user?.imageUrl || null,
        };

        const session: SessionInfo = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || null,
          expiresIn: data.expires_in || 3600,
          refreshExpiresIn: data.refresh_expires_in || null,
          expiresAt: parseExpiresIn(data.expires_in || 3600),
        };

        saveSession(userData, session);
        return true;
      }

      clearSession();
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      clearSession();
      return false;
    }
  }, [user, clearSession, saveSession]);

  // Restore session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    const storedSession = localStorage.getItem("session_info");

    if (storedUser && storedSession) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        const parsedSession = JSON.parse(storedSession) as SessionInfo;

        // Check if access token is still valid (with 30s buffer)
        if (parsedSession.expiresAt > Date.now() + 30_000) {
          setUser(parsedUser);
          setSessionInfo(parsedSession);
          scheduleTokenRefresh(parsedSession);
        } else if (parsedSession.refreshToken) {
          // Access token expired but we have refresh token - try refresh
          doRefresh(parsedSession.refreshToken);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
  }, []);

  const login = async (identifier: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.access_token && data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          nameWithInitials: data.user.nameWithInitials,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          userType: data.user.userType,
          imageUrl: data.user.imageUrl,
        };

        const session: SessionInfo = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || null,
          expiresIn: data.expires_in || 3600,
          refreshExpiresIn: data.refresh_expires_in || null,
          expiresAt: parseExpiresIn(data.expires_in || 3600),
        };

        saveSession(userData, session);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const body: Record<string, string> = {};
      if (sessionInfo?.refreshToken) body.refresh_token = sessionInfo.refreshToken;

      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionInfo?.accessToken && { Authorization: `Bearer ${sessionInfo.accessToken}` }),
        },
        credentials: "include",
        body: JSON.stringify(body),
      }).catch(() => {});
    } finally {
      clearSession();
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;
    try {
      return await doRefresh(sessionInfo?.refreshToken || null);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!sessionInfo,
        accessToken: sessionInfo?.accessToken || null,
        sessionInfo,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
