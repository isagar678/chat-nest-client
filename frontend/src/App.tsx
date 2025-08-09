import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginForm } from "./components/login-form"
import { RegisterForm } from "./components/register-form"
import {Dashboard} from "./components/Dashboard";
import Chats from "./components/MessageBoard";
import { useContext } from "react";
import AuthContext from "./context/AuthContext";
import { ChatApp } from "./components/chat/ChatApp";

function App() {

  const {accessToken, loading} = useContext(AuthContext)
  
  const ProtectedRoute = ({ children }) => {
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!accessToken) {
      // Redirect to login if not authenticated
      return <Navigate to="/login" replace />;
    }
    
    return children;
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
      </Routes>
    </BrowserRouter>
  )
}

export default App