import { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from 'axios';

interface AuthContextType {
  user: any;
  accessToken: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (credentials: { username: string; name: string; password: string }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:3000';

// Create axios instance outside component to prevent recreation
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (for refresh token)
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const interceptorRef = useRef<number | null>(null);
  const initialRefreshAttempted = useRef(false);

  // Attach access token to requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken]);

  // Refresh token logic
  const refreshAccessToken = useCallback(async () => {
    if (refreshing) {
      return null;
    }
    
    setRefreshing(true);
    try {
      const response = await api.post('/auth/token', {});
      const { access_token, refresh_token } = response.data;

      setAccessToken(access_token);
      
      // The new refresh token is automatically set in the cookie by the server
      // We don't need to store it in state, just use the access token
      
      return access_token;
    } catch (err) {
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  // Axios response interceptor for 401
  useEffect(() => {
    // Remove existing interceptor if it exists
    if (interceptorRef.current !== null) {
      api.interceptors.response.eject(interceptorRef.current);
    }

    interceptorRef.current = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !refreshing
        ) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorRef.current !== null) {
        api.interceptors.response.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
    };
  }, [refreshAccessToken, refreshing]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, try to refresh token and fetch user
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      // Only attempt initial refresh once
      if (initialRefreshAttempted.current) {
        if (!accessToken) {
          setLoading(false);
        }
        return;
      }
      
      initialRefreshAttempted.current = true;
      
      try {
        const response = await api.post('/auth/token', {});
        const { access_token } = response.data;
        
        if (mounted) {
          setAccessToken(access_token);
          await fetchUserData();
        }
      } catch (error) {
        console.error('Initial token refresh failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchUserData]);

  // Login
  const login = async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    const { access_token } = response.data;
    setAccessToken(access_token);
    await fetchUserData();
  };

  // Register
  const register = async (credentials: { username: string; name: string; password: string }) => {
    const response = await api.post('/auth/register', credentials);
    const { access_token } = response.data;
    setAccessToken(access_token);
    await fetchUserData();
  };

  // Google login
  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  // Logout
  const logout = () => {
    setAccessToken(null);
    setUser(null);
    // Optionally, call a logout endpoint to clear refresh token cookie
    api.post('/auth/logout').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, register, logout, loginWithGoogle, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthContext;