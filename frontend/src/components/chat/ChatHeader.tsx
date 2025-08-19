import { useContext } from 'react';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bot } from 'lucide-react';
import AuthContext from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BotChat } from './BotChat';

interface ChatHeaderProps {
  chatName: string;
  isOnline?: boolean;
  avatar?: string;
  lastSeen?: string;
}

export function ChatHeader({ chatName, isOnline, avatar, lastSeen }: ChatHeaderProps) {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;
  const navigate = useNavigate();
  const [botOpen, setBotOpen] = useState(false);



  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="relative">
          <SmartAvatar 
            src={avatar} 
            alt={chatName} 
            fallback={chatName}
            size="md"
            className="bg-primary text-dark-foreground"
          />
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground">{chatName}</h3>
          <p className="text-xs text-muted-foreground">
            {isOnline ? 'Online' : lastSeen}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setBotOpen(true)}
          title="Chat with Gemini"
        >
          <Bot className="h-4 w-4 text-pink-600" />
        </Button>
        {/* User Avatar - Clickable to go to profile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0"
          onClick={handleProfileClick}
          title="Go to Profile"
        >
          <SmartAvatar 
            src={currentUser?.avatar} 
            alt={currentUser?.name} 
            fallback={currentUser?.name || currentUser?.userName}
            size="sm"
            className="bg-primary text-dark-foreground"
          />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      {botOpen && <BotChat open={botOpen} onClose={() => setBotOpen(false)} />}
    </div>
  );
}