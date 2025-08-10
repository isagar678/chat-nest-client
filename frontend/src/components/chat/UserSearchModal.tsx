import { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Search, Send, User, MessageCircle } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import type { SearchedUser } from '@/types/chat';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (userId: number, message: string, userDetails: SearchedUser) => Promise<void>;
  className?: string;
}

export function UserSearchModal({ 
  isOpen, 
  onClose, 
  onSendMessage, 
  className 
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  
  const api = useApi();
  const { toast } = useToast();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/user/find/person?query=${encodeURIComponent(query.trim())}`);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [api, toast]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleUserSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    setShowMessageInput(true);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(selectedUser.id, message.trim(), selectedUser);
      
      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${selectedUser.name}`,
      });

      // Reset state and close modal
      setMessage('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setShowMessageInput(false);
      onClose();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setShowMessageInput(false);
    setMessage('');
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setShowMessageInput(false);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showMessageInput ? (
              <>
                <MessageCircle className="h-5 w-5" />
                Send Message
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Find Users
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showMessageInput 
              ? `Send a message to ${selectedUser?.name}` 
              : 'Search for users by name or username to start a conversation'
            }
          </DialogDescription>
        </DialogHeader>

        {!showMessageInput ? (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <ScrollArea className="h-64">
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-sm text-muted-foreground">Searching...</div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {searchQuery.trim() ? 'No users found' : 'Start typing to search for users'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 border border-transparent hover:border-border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.userName}
                        </p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected User Info */}
            <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedUser?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{selectedUser?.name}</h3>
                <p className="text-sm text-muted-foreground">@{selectedUser?.userName}</p>
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isSending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
