import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/useApi';
import { useContext } from 'react';
import { SocketContext } from '@/context/WebSocketContext';
import AuthContext from '@/context/AuthContext';
import type { Group, GroupMessage, GroupMember } from '@/types/chat';
import { Send, Users, MoreVertical, File, Paperclip } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupChatProps {
  group: Group;
  onClose: () => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({ group, onClose }) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const api = useApi();
  const socket = useContext(SocketContext);
  const { accessToken, user } = useContext(AuthContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debug: Log message state changes
  useEffect(() => {
    console.log('GroupChat: Messages state updated, count:', messages.length);
    console.log('GroupChat: Latest messages:', messages.slice(-3)); // Show last 3 messages
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  useEffect(() => {
    loadMessages();
  }, [group.id]);

  useEffect(() => {
    if (!socket) return;

    // Users are automatically joined to their groups when they connect
    // No need to manually join the group room

    // Listen for group messages
    const handleGroupMessage = (data: any) => {
      console.log('GroupChat: Received group message:', data);
      console.log('GroupChat: Current group ID:', group.id);
      console.log('GroupChat: Message group ID:', data.groupId);
      
      if (data.groupId === group.id) {
        console.log('GroupChat: Message is for current group, adding to messages');
        
        // Check if this message is already in the state (prevent duplicates)
        const isDuplicate = messages.some(msg => 
          msg.content === data.message && 
          msg.from.id === data.from &&
          Math.abs(new Date(msg.timeStamp).getTime() - new Date(data.timestamp).getTime()) < 1000 // Within 1 second
        );
        
        if (isDuplicate) {
          console.log('GroupChat: Duplicate message detected, skipping...');
          return;
        }
        
        const newGroupMessage: GroupMessage = {
          id: Date.now() + Math.random(), // Better unique ID generation
          content: data.message,
          timeStamp: data.timestamp || new Date().toISOString(),
          read: false,
          filePath: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.fileType,
          from: {
            id: data.from,
            name: data.fromName || 'Unknown',
            userName: 'unknown',
          },
          group: {
            id: data.groupId,
            name: group.name,
          },
        };
        
        console.log('GroupChat: Created new message object:', newGroupMessage);
        
        setMessages(prev => {
          const updatedMessages = [...prev, newGroupMessage];
          console.log('GroupChat: Updated messages state, new count:', updatedMessages.length);
          return updatedMessages;
        });
      } else {
        console.log('GroupChat: Message is not for current group:', data.groupId, 'vs', group.id);
      }
    };

    const handleGroupMessageError = (data: any) => {
      console.log('GroupChat: Received group message error:', data);
      if (data.groupId === group.id) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    };

    // Debug: Log when event listeners are attached
    console.log('GroupChat: Setting up WebSocket listeners for group:', group.id);
    console.log('GroupChat: Socket connected:', socket.connected);
    
    socket.on('groupMessageReceived', handleGroupMessage);
    socket.on('groupMessageError', handleGroupMessageError);
    socket.on('testResponse', (data: any) => {
      console.log('GroupChat: Received test response from server:', data);
    });

    // Test if we can receive messages
    console.log('GroupChat: Testing socket connection...');
    socket.emit('test', { message: 'Test from GroupChat', groupId: group.id });

    return () => {
      console.log('GroupChat: Cleaning up WebSocket listeners');
      socket.off('groupMessageReceived', handleGroupMessage);
      socket.off('groupMessageError', handleGroupMessageError);
    };
  }, [socket, group.id, group.name, messages]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await api.get(`/group/${group.id}/messages?limit=50`);
      setMessages(response.data.reverse()); // Reverse to show newest at bottom
    } catch (error) {
      console.error('Error loading group messages:', error);
      toast({
        title: "Error",
        description: "Failed to load group messages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    setIsLoading(true);
    try {
      let filePath: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await api.post('/user/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        filePath = uploadResponse.data.filePath;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
        setIsUploading(false);
      }

      // Send message via socket
      socket?.emit('groupMessage', {
        groupId: group.id,
        message: newMessage.trim(),
        filePath,
        fileName,
        fileSize,
        fileType: mimeType,
      });

      // Add message to local state immediately for better UX
      const localMessage: GroupMessage = {
        id: Date.now() + Math.random(),
        content: newMessage.trim(),
        timeStamp: new Date().toISOString(),
        read: false,
        filePath,
        fileName,
        fileSize,
        mimeType,
        from: {
          id: user?.id || 0,
          name: user?.name || 'You',
          userName: user?.userName || 'You',
        },
        group: {
          id: group.id,
          name: group.name,
        },
      };
      
      console.log('GroupChat: Adding local message:', localMessage);
      
      setMessages(prev => {
        const updatedMessages = [...prev, localMessage];
        console.log('GroupChat: Updated messages with local message, new count:', updatedMessages.length);
        return updatedMessages;
      });

      // Clear input
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    return '📎';
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <p className="text-sm text-muted-foreground">
                {group.users.length} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={loadMessages}>
                  Refresh Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose}>
                  Close Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const currentUserId = user?.id || 0;
                const isOwnMessage = message.from.id === currentUserId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.from.avatar} />
                        <AvatarFallback>
                          {message.from.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage ? 'order-first' : ''
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.from.name}
                        </p>
                      )}
                      
                      <div
                        className={`rounded-lg p-3 ${
                          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        {message.filePath && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs opacity-80">
                              <span>{getFileIcon(message.mimeType || '')}</span>
                              <span>{message.fileName}</span>
                            </div>
                            <a
                              href={`${import.meta.env.VITE_SERVER_URL}/user/file/${message.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline hover:no-underline"
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.timeStamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3 bg-background flex-shrink-0">
          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <File className="h-4 w-4" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSelectedFile}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading || isUploading}
              className="flex-1"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || isUploading || (!newMessage.trim() && !selectedFile)}
              size="sm"
            >
              {isLoading || isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
        </div>
      </div>
    </div>
  );
};
