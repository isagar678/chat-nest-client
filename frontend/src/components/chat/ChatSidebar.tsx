import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FriendDetails {
  id: number;
  name: string;
  userName: string;
}

interface Friend {
  friendDetails: FriendDetails;
  messages: any[];
}

interface ChatSidebarProps {
  className?: string;
  onChatSelect?: (friendIndex: number) => void;
  selectedChatId?: number;
  friends: Friend[];
}



export function ChatSidebar({ className, onChatSelect, selectedChatId, friends }: ChatSidebarProps) {
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
          {friends.map((friend, index) => {
            const lastMessage = friend.messages[friend.messages.length - 1];
            const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
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
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {friend.friendDetails.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}