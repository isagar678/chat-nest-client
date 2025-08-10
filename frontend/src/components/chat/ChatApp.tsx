import { useContext, useEffect, useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useApi } from '@/lib/useApi';
import { SocketContext } from '@/context/WebSocketContext';
import { eventHandlers } from '@/lib/eventHandlers';
import { useSocketEvents } from '@/lib/useSocketEvents';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/lib/utils';

interface Message {
  id?: number;
  content: string;
  timestamp?: string;
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
  const [selectedFriend, setSelectedFriend] = useState<any>(initialChats.friends[0].friendDetails);
  const [allChats, setAllChats] = useState(initialChats);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const api = useApi();
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (!socket) return;
  
    const handlePrivateMessage = async (data: any) => {
      console.log('Received private message:', data);
      
      setAllChats(prevChats => {
        // Check if we already have a chat with this user
        const chatIndex = prevChats.friends.findIndex(
          chat => chat.friendDetails.id === parseInt(data.from)
        );
  
        if (chatIndex !== -1) {
          // Update existing chat
          const updatedFriends = [...prevChats.friends];
          const newMessage: Message = {
            id: Date.now(), // Generate temporary ID
            content: data.message,
            timestamp: new Date().toISOString(),
            isSent: false,
          };
          
          updatedFriends[chatIndex] = {
            ...updatedFriends[chatIndex],
            messages: [...updatedFriends[chatIndex].messages, newMessage]
          };
          
          // Show notification if message is not from currently selected friend
          if (selectedFriendIndex !== chatIndex) {
            const senderName = data.fromName || `User ${data.from}`;
            toast({
              title: `New message from ${senderName}`,
              description: data.message,
              duration: 5000,
            });
            playNotificationSound();
          } else {
            // If message is from currently selected friend, mark as read immediately
            try {
              api.put('/user/mark/read', {
                from: parseInt(data.from)
              });
            } catch (error) {
              console.error('Failed to mark message as read:', error);
            }
          }
          
          return {
            ...prevChats,
            friends: updatedFriends
          };
        } else {
          // If no existing chat, show notification and log
          const senderName = data.fromName || `User ${data.from}`;
          toast({
            title: `New message from ${senderName}`,
            description: data.message,
            duration: 5000,
          });
          playNotificationSound();
          console.log('Message from unknown user:', data);
        }
        
        return prevChats;
      });
    };

    const handleTypingStart = (data: any) => {
      if (data.from !== selectedFriend?.id) return;
      setTypingUsers(prev => new Set(prev).add(data.from));
    };

    const handleTypingStop = (data: any) => {
      if (data.from !== selectedFriend?.id) return;
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.from);
        return newSet;
      });
    };
  
    socket.on('privateMessageReceived', handlePrivateMessage);
    socket.on('typingStart', handleTypingStart);
    socket.on('typingStop', handleTypingStop);
  
    return () => {
      socket.off('privateMessageReceived', handlePrivateMessage);
      socket.off('typingStart', handleTypingStart);
      socket.off('typingStop', handleTypingStop);
    };
  }, [socket, selectedFriendIndex, toast, selectedFriend, api]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/user/my/friends');
        console.log('Users fetched:', response.data);
        setAllChats(response.data)
        setSelectedFriend(response.data.friends[0].friendDetails)
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [api]);




  const currentFriend = allChats.friends[selectedFriendIndex];
  const messages = currentFriend?.messages || [];

  // Calculate unread counts for each friend
  const friendsWithUnreadCounts = allChats.friends.map(friend => {
    const unreadCount = friend.messages.filter(msg => !msg.isSent && !msg.isRead).length;
    return {
      ...friend,
      unreadCount
    };
  });

  const handleSendMessage = (content: string) => {
    if (selectedFriendIndex === null || !content.trim()) return;

    if (socket) {
      console.log('Sending message to:', selectedFriend);

      // Emit the message to the backend
      socket.emit('privateMessage', {
        recipientId: selectedFriend.id,
        message: content.trim()
      });

      // Stop typing indicator
      socket.emit('typingStop', { to: selectedFriend.id });

      // Create new message object
      const newMessage: Message = {
        id: Date.now(), // Generate temporary ID
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isSent: true,
      };

      // Update local state immediately for optimistic UI
      setAllChats(prev => ({
        ...prev,
        friends: prev.friends.map((friend, index) =>
          index === selectedFriendIndex
            ? { ...friend, messages: [...friend.messages, newMessage] }
            : friend
        )
      }));
    }
  };

  const handleTyping = (isUserTyping: boolean) => {
    if (!socket || !selectedFriend) return;
    
    if (isUserTyping) {
      socket.emit('typingStart', { to: selectedFriend.id });
    } else {
      socket.emit('typingStop', { to: selectedFriend.id });
    }
  };

  const handleChatSelect =async (friendIndex: number) => {
    setSelectedFriendIndex(friendIndex);
    setSelectedFriend(allChats.friends[friendIndex].friendDetails)

    // Mark messages as read when selecting a chat
    try {
      await api.put('/user/mark/read', {
        from: allChats.friends[friendIndex].friendDetails.id
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }

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
          friends={friendsWithUnreadCounts}
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
            <ChatArea messages={messages} isTyping={typingUsers.has(selectedFriend?.id)} />
            <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
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