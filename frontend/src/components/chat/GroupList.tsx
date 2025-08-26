import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/useApi';
import type { Group } from '@/types/chat';
import { Users} from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';
import { SocketContext } from '@/context/WebSocketContext';

interface GroupListProps {
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: number;
}

export const GroupList: React.FC<GroupListProps> = ({ onSelectGroup, selectedGroupId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const api = useApi();
  const socket = useContext(SocketContext);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/group/my-groups');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Update unread counts and last message in realtime when a group message arrives
  useEffect(() => {
    if (!socket) return;
    const handleGroupMessage = (data: any) => {
      setGroups(prev => prev.map(g => {
        if (g.id !== data.groupId) return g;
        const newChat = {
          id: Date.now() + Math.random(),
          content: data.message,
          timeStamp: data.timestamp,
          read: selectedGroupId === g.id, // if currently viewing, mark read
          filePath: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.fileType,
          from: data.from,
        } as any;
        const chats = Array.isArray(g.chats) ? [...g.chats, newChat] : [newChat];
        return { ...g, chats } as Group;
      }));
    };
    const handleGroupMessagesRead = (data: { groupId: number }) => {
      setGroups(prev => prev.map(g => {
        if (g.id !== data.groupId) return g;
        const chats = Array.isArray(g.chats) ? g.chats.map(c => ({ ...c, read: true })) : g.chats;
        return { ...g, chats } as Group;
      }));
    };
    socket.on('groupMessageReceived', handleGroupMessage);
    socket.on('groupMessagesRead', handleGroupMessagesRead);
    return () => {
      socket.off('groupMessageReceived', handleGroupMessage);
      socket.off('groupMessagesRead', handleGroupMessagesRead);
    };
  }, [socket, selectedGroupId]);

  const handleGroupCreated = () => {
    loadGroups(); // Refresh the list when a new group is created
  };

  const formatLastMessage = (group: Group) => {
    if (!group.chats || group.chats.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = group.chats[group.chats.length - 1];
    const content = lastMessage.content || 'File shared';
    return content.length > 30 ? `${content.substring(0, 30)}...` : content;
  };

  const formatLastMessageTime = (group: Group) => {
    if (!group.chats || group.chats.length === 0) {
      return '';
    }
    
    const lastMessage = group.chats[group.chats.length - 1];
    const timestamp = new Date(lastMessage.timeStamp);
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return timestamp.toLocaleTimeString([], { minute: '2-digit' });
    } else if (diffInHours < 24) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (group: Group) => {
    if (!group.chats) return 0;
    return group.chats.filter(chat => !chat.read).length;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups
          </CardTitle>
          <CreateGroupModal onGroupCreated={handleGroupCreated} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start chatting with multiple people
            </p>
            <CreateGroupModal onGroupCreated={handleGroupCreated} />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {groups.map((group) => {
                const unreadCount = getUnreadCount(group);
                const isSelected = selectedGroupId === group.id;
                
                return (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => onSelectGroup(group)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{group.name}</h4>
                          <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                              <Badge 
                                variant={isSelected ? "secondary" : "default"} 
                                className="h-5 px-1.5 text-xs"
                              >
                                {unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs opacity-70">
                              {formatLastMessageTime(group)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-sm truncate ${
                          isSelected ? 'opacity-80' : 'text-muted-foreground'
                        }`}>
                          {formatLastMessage(group)}
                        </p>
                        
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs ${
                            isSelected ? 'opacity-70' : 'text-muted-foreground'
                          }`}>
                            {group.users.length} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
