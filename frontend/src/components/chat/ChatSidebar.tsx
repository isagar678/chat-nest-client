import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { useApi } from '@/lib/useApi';

interface FriendDetails {
  id: number;
  name: string;
  userName: string;
}

interface Friend {
  friendDetails: FriendDetails;
  messages: any[];
  unreadCount?: number; // Add unread count
}

interface ChatSidebarProps {
  className?: string;
  onChatSelect?: (friendIndex: number) => void;
  selectedChatId?: number;
  friends: Friend[];
}

export function ChatSidebar({ className, onChatSelect, selectedChatId, friends }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const api = useApi();

  const filteredFriends = useMemo(async () => {
    if (!searchTerm.trim()) return friends;
    
    const term = searchTerm.toLowerCase();
    const searchFreinds = friends.filter(friend => 
      friend.friendDetails.name.toLowerCase().includes(term) ||
      friend.friendDetails.userName.toLowerCase().includes(term) ||
      friend.messages.some(msg => 
        msg.content.toLowerCase().includes(term)
      )
    );

    if (searchFreinds.length==0) {
        const response =await api.get(`user/find/person?input=${searchTerm}`)
        searchFreinds.push(response.data)
    }

    return searchFreinds
  }, [friends, searchTerm]);

  return (
    <div className={cn("w-80 bg-card border-r border-border flex flex-col h-full", className)}>
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
            placeholder="Search by username..."
            className="pl-10 bg-background border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFriends.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            filteredFriends.map((friend, index) => {
            const lastMessage = friend.messages[friend.messages.length - 1];
            const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const unreadCount = friend.unreadCount || 0;
            
            return (
              <div
                key={friend.friendDetails.id}
                onClick={() => onChatSelect?.(index)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                  selectedChatId === index && "bg-accent"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {friend.friendDetails.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {/* Unread message indicator */}
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      unreadCount > 0 ? "text-foreground font-semibold" : "text-foreground"
                    )}>
                      {friend.friendDetails.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {lastMessageTime}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm truncate",
                    unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              </div>
            );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}