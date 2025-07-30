import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'; 
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from './context/WebSocketContext.tsx';

createRoot(document.getElementById('root')!).render(

    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>

)
