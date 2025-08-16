import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginForm } from "./components/login-form"
import { RegisterForm } from "./components/register-form"
import {Dashboard} from "./components/Dashboard";
import Chats from "./components/MessageBoard";
import { useContext, useEffect } from "react";
import AuthContext from "./context/AuthContext";
import { ChatApp } from "./components/chat/ChatApp";

function App() {

  const auth = useContext(AuthContext)
  const accessToken = auth?.accessToken
  const loading = auth?.loading
  
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!accessToken) {
      // Redirect to login if not authenticated
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  // Google OAuth Callback Handler
  const GoogleCallback = () => {
    useEffect(() => {
      const timer = setTimeout(() => {
        // If still on this page after 2 seconds, redirect to login
        if (window.location.pathname === '/api') {
          window.location.href = '/login';
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Processing Google login...</p>
        </div>
      </div>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard/>
          </ProtectedRoute>
        }/>
        <Route path="/protected" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
        <Route path="/o" element={
          <ProtectedRoute>
            <Chats className="flex min-h-svh flex-col items-center justify-center"/>
          </ProtectedRoute>
        }/>
        <Route path="/login" element={<LoginForm className="flex min-h-svh flex-col items-center justify-center" />} />
        <Route path="/register" element={<RegisterForm className="flex min-h-svh flex-col items-center justify-center" />} />
        <Route path="/chats" element={<ProtectedRoute>
            <ChatApp/>
          </ProtectedRoute>} />
        <Route path="/api" element={<GoogleCallback />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App