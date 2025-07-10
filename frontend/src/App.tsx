import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LoginForm } from "./components/login-form"
import { RegisterForm } from "./components/register-form"

function App() {
  return (
        <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm className="flex min-h-svh flex-col items-center justify-center" />} />
        <Route path="/register" element={<RegisterForm className="flex min-h-svh flex-col items-center justify-center" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App