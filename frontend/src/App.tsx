import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LoginForm } from "./components/login-form"
import { RegisterForm } from "./components/register-form"
import { useState } from "react";
import {Dashboard} from "./components/Dashboard";
function App() {
  const [token, setToken] = useState({ access_token: null, refresh_token: null });

  if (!token) {
    return <LoginForm setToken={setToken} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/login" element={<LoginForm className="flex min-h-svh flex-col items-center justify-center" />} />
        <Route path="/register" element={<RegisterForm className="flex min-h-svh flex-col items-center justify-center" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App