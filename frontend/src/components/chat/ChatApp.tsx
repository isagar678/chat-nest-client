import React, { useContext, useEffect, useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AuthContext from '@/context/AuthContext';
import { useApi } from '@/lib/useApi';

interface Message {
  id: number;
  content: string;
  timestamp: string;
  isSent: boolean;
}

interface FriendDetails {
  id: number;
  name: string;
  userName: string;
}

interface Friend {
  friendDetails: FriendDetails;
  messages: Message[];
}

interface AllChats {
  friends: Friend[];
}

const initialChats: AllChats = {
  friends: [
    {
      friendDetails: {
        id: 1,
        name: 'Sarah Johnson',
        userName: 'sarah',
      },
      messages: [
        {
          id: 1,
          content: 'Hey! How are you doing today?',
          timestamp: '2025-01-08T10:30:00.000Z',
          isSent: false,
        }
      ]
    },
  ]
}

export function ChatApp() {
  const [selectedFriendIndex, setSelectedFriendIndex] = useState(0);
  const [allChats, setAllChats] = useState(initialChats);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const api = useApi();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/user/my/friends');
        console.log('Users fetched:', response.data);
        setAllChats(response.data)
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [api]);


  const currentFriend = allChats.friends[selectedFriendIndex];
  const messages = currentFriend?.messages || [];

  const handleSendMessage = (content: string) => {
    if (selectedFriendIndex === null) return;

    const newMessage: Message = {
      id: Date.now(),
      content,
      timestamp: new Date().toISOString(),
      isSent: true,
    };

    setAllChats(prev => ({
      ...prev,
      friends: prev.friends.map((friend, index) =>
        index === selectedFriendIndex
          ? { ...friend, messages: [...friend.messages, newMessage] }
          : friend
      )
    }));
  };

  const handleChatSelect = (friendIndex: number) => {
    setSelectedFriendIndex(friendIndex);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "relative z-50 transition-transform duration-300",
        isMobile ? "fixed inset-y-0 left-0" : "relative",
        isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <ChatSidebar
          onChatSelect={handleChatSelect}
          selectedChatId={selectedFriendIndex}
          friends={allChats.friends}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu button */}
        {isMobile && (
          <div className="flex items-center p-4 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-3"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          </div>
        )}

        {selectedFriendIndex !== null ? (
          <>
            <ChatHeader
              chatName={currentFriend?.friendDetails.name || ""}
              isOnline={false}
              avatar={undefined}
            />
            <ChatArea messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to Chat
              </h3>
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}