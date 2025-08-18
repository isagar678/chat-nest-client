import { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from 'axios';
import { supabase } from "@/lib/supabase.client";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (credentials: { username: string; name: string; password: string }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:3000';

// Create axios instance outside component to prevent recreation
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (for refresh token)
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken')
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const interceptorRef = useRef<number | null>(null);

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
      const { access_token } = response.data;

      setAccessToken(access_token);
      localStorage.setItem('accessToken', access_token);
      
      // Also set the token in axios defaults to ensure it's used immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // The new refresh token is automatically set in the cookie by the server
      // We don't need to store it in state, just use the access token
      
      return access_token;
    } catch (err) {
      setAccessToken(null);
      localStorage.removeItem('accessToken');
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
  const fetchUserData = useCallback(async (token?: string) => {
    try {
      const tokenToUse = token || accessToken;
      if (tokenToUse) {
        api.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
      }
      // Prefer detailed profile that includes avatar
      const response = await api.get('/user/my/avatar');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch detailed user data, falling back to basic profile:', error);
      try {
        const basic = await api.get('/auth/profile');
        setUser(basic.data);
      } catch (innerErr) {
        console.error('Failed to fetch user profile:', innerErr);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [api, accessToken]);

  // On mount, try to refresh token and fetch user
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      // Check for access token in URL parameters first (for Google OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const urlAccessToken = urlParams.get('access_token');
      
      if (urlAccessToken) {
        console.log('Found access token in URL parameters:', urlAccessToken);
        setAccessToken(urlAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${urlAccessToken}`;
        await fetchUserData(urlAccessToken);
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return;
      }
      
      // If we already have an access token, just fetch user data
      if (accessToken) {
        await fetchUserData();
        return;
      }
      
      // Try to get a new token using refresh token
      try {
        const response = await api.post('/auth/token', {});
        const { access_token } = response.data;
        
        if (mounted) {
          setAccessToken(access_token);
          
          // Also set the token in axios defaults to ensure it's used immediately
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          await fetchUserData(access_token);
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
    localStorage.setItem('accessToken', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    supabase.auth.setSession({
      access_token: access_token,
      refresh_token: '',
    });

    await fetchUserData(access_token);
  };

  // Register
  const register = async (credentials: { username: string; name: string; password: string }) => {
    const response = await api.post('/auth/register', credentials);
    const { access_token } = response.data;
    setAccessToken(access_token);
    localStorage.setItem('accessToken', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    supabase.auth.setSession({
      access_token: access_token,
      refresh_token: '',
    });
    
    await fetchUserData(access_token);
  };

  // Google login
  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  // Logout
  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setUser(null);
    // Call logout endpoint to clear refresh token cookie
    api.post('/auth/logout').catch(() => {});
  };

  // Refresh user data
  const refreshUserData = async () => {
    await fetchUserData();
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, register, logout, loginWithGoogle, loading, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthContext;