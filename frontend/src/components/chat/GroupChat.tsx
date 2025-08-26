import React, { useState, useEffect, useRef, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/useApi';
import { SocketContext } from '@/context/WebSocketContext';
import AuthContext from '@/context/AuthContext';
import type { Group, GroupMessage } from '@/types/chat';
import { Users, MoreVertical } from 'lucide-react';
import { ChatInput } from './ChatInput';
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
    if (socket) {
      try {
        socket.emit('markGroupMessagesRead', { groupId: group.id });
      } catch {}
    }
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
        setMessages(prev => {
          // Prevent duplicates based on content, sender, and near-identical timestamp
          const isDuplicate = prev.some(msg =>
            msg.content === data.message &&
            msg.from.id === data.from &&
            Math.abs(new Date(msg.timeStamp).getTime() - new Date((data.timestamp || new Date().toISOString())) .getTime()) < 1000
          );
          if (isDuplicate) {
            console.log('GroupChat: Duplicate message detected, skipping...');
            return prev;
          }
          const newGroupMessage: GroupMessage = {
            id: Date.now() + Math.random(),
            content: data.message,
            timeStamp: data.timestamp || new Date().toISOString(),
            read: true, // viewing this group, mark as read
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
          const updated = [...prev, newGroupMessage];
          console.log('GroupChat: Updated messages state, new count:', updated.length);
          return updated;
        });
        // Inform server that messages are read since this group is open
        try { socket.emit('markGroupMessagesRead', { groupId: group.id }); } catch {}
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
    const handleGroupMessagesRead = (data: { groupId: number; readBy: number }) => {
      if (data.groupId !== group.id) return;
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
    };
    socket.on('groupMessagesRead', handleGroupMessagesRead);
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
      socket.off('groupMessagesRead', handleGroupMessagesRead);
    };
  }, [socket, group.id, group.name]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await api.get(`/group/${group.id}/messages?limit=50`);
      setMessages(response.data.reverse()); // Reverse to show newest at bottom
      try { socket?.emit('markGroupMessagesRead', { groupId: group.id }); } catch {}
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

  // Legacy input logic removed in favor of shared ChatInput

  // New: use shared ChatInput to send messages (with optional file)
  const handleSendFromChatInput = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;
    // Note: ChatInput manages its own disabled state via isUploading
    try {
      let filePath: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await api.post('/user/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        filePath = uploadResponse.data.filePath;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
        setIsUploading(false);
      }

      // Send message via socket
      socket?.emit('groupMessage', {
        groupId: group.id,
        message: content.trim(),
        filePath,
        fileName,
        fileSize,
        fileType: mimeType,
      });

      // Add message locally for instant feedback
      const localMessage: GroupMessage = {
        id: Date.now() + Math.random(),
        content: content.trim(),
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

      setMessages(prev => [...prev, localMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      // no-op
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={async () => {
                                try {
                                  if (!message.filePath) return;
                                  const encodedPath = encodeURI(message.filePath);
                                  const resp = await api.get(`/user/file/${encodedPath}`);
                                  const url = resp.data.url;
                                  window.open(url, '_blank');
                                } catch (e) {
                                  console.error('Failed to get download URL', e);
                                }
                              }}
                            >
                              Download
                            </Button>
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

        {/* Input Area - using shared ChatInput for emoji, voice, attachments */}
        <div className="border-t bg-background flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendFromChatInput}
            isUploading={isUploading}
            placeholder={`Message #${group.name}`}
          />
        </div>
      </div>
    </div>
  );
};
