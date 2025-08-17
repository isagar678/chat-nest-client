
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

import { UserSearchModal } from './UserSearchModal';

import type { Friend, SearchedUser } from '@/types/chat';

interface ChatSidebarProps {
  className?: string;
  onChatSelect?: (friendIndex: number) => void;
  selectedChatId?: number;
  friends: Friend[];
  onSendMessageToNewUser?: (userId: number, message: string, userDetails: SearchedUser) => Promise<void>;
}

export function ChatSidebar({ className, onChatSelect, selectedChatId, friends, onSendMessageToNewUser }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) return friends;
    
    const term = searchTerm.toLowerCase();
    return friends.filter(friend => 
      friend.friendDetails.name.toLowerCase().includes(term) ||
      friend.friendDetails.userName.toLowerCase().includes(term) ||
      friend.messages.some(msg => 
        msg.content.toLowerCase().includes(term)
      )
    );
  }, [friends, searchTerm]);

  const handleSearchNewUsers = () => {
    setIsSearchModalOpen(true);
  };

  const handleSendMessageToNewUser = async (userId: number, message: string, userDetails: SearchedUser) => {
    if (onSendMessageToNewUser) {
      await onSendMessageToNewUser(userId, message, userDetails);
    }
  };

  return (
    <div className={cn("w-80 bg-card border-r border-border flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-chat-sidebar-foreground">Messages</h2>
        </div>
        
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={handleSearchNewUsers}
          >
            <UserPlus className="h-4 w-4" />
            Find New Users
          </Button>
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
            const lastMessageTime = lastMessage && lastMessage.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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
                  <SmartAvatar 
                    src={friend.friendDetails.avatar} 
                    alt={friend.friendDetails.name} 
                    fallback={friend.friendDetails.name}
                    size="lg"
                    className="bg-primary text-primary-foreground"
                  />
                  
                  {/* Online indicator */}
                  {friend.isOnline && (
                    <div className="absolute -bottom-0 -right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                  
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

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSendMessage={handleSendMessageToNewUser}
      />
    </div>
  );
}