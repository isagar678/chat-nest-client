import { createContext, useState, useEffect, useCallback } from "react";
import axios from 'axios';

interface AuthContextType {
  user: any;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (credentials: { username: string; name: string; password: string }) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:3000';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set up axios instance
  const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // send cookies (for refresh token)
  });

  // Attach access token to requests
  api.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Refresh token logic
  const refreshAccessToken = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(
        `${API_BASE}/auth/token`,
        {},
        { withCredentials: true }
      );
      const { access_token } = response.data;
      setAccessToken(access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return access_token;
    } catch (err) {
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [api]);

  // Axios response interceptor for 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
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
      api.interceptors.response.eject(interceptor);
    };
  }, [accessToken, refreshAccessToken, refreshing, api]);

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
  }, [api]);

  // On mount, try to refresh token and fetch user
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          `${API_BASE}/auth/token`,
          {},
          { withCredentials: true }
        );
        const { access_token } = response.data;
        setAccessToken(access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        axios.defaults.withCredentials = true;        
        await fetchUserData();
      } catch {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // Login
  const login = async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    const { access_token } = response.data;
    setAccessToken(access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    axios.defaults.withCredentials = true;
    await fetchUserData();
  };

  // Register
  const register = async (credentials: { username: string; name: string; password: string }) => {
    const response = await api.post('/auth/register', credentials);
    const { access_token } = response.data;
    setAccessToken(access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    axios.defaults.withCredentials = true;
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
    axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loginWithGoogle, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthContext;