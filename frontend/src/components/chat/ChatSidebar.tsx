import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar?: string;
  isActive?: boolean;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatSidebarProps {
  className?: string;
  onChatSelect?: (chatId: string) => void;
  selectedChatId?: string;
}

const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastMessage: 'Hey! How are you doing today?',
    timestamp: '2m',
    avatar: '/placeholder.svg',
    isActive: true,
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Design Team',
    lastMessage: 'The new mockups look great!',
    timestamp: '1h',
    unreadCount: 5,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Mike Chen',
    lastMessage: 'Thanks for the help yesterday',
    timestamp: '3h',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Project Updates',
    lastMessage: 'Sprint planning meeting at 3 PM',
    timestamp: '1d',
    unreadCount: 1,
    isOnline: false,
  },
];

export function ChatSidebar({ className, onChatSelect, selectedChatId }: ChatSidebarProps) {
  return (
    <div className={cn("w-80 bg-chat-sidebar border-r border-border flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-chat-sidebar-foreground">Messages</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect?.(chat.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                selectedChatId === chat.id && "bg-accent"
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {chat.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>

              {chat.unreadCount && (
                <div className="h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}