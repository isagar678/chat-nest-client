import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Video, MoreVertical, Search } from 'lucide-react';

interface ChatHeaderProps {
  chatName: string;
  isOnline?: boolean;
  avatar?: string;
  lastSeen?: string;
}

export function ChatHeader({ chatName, isOnline, avatar, lastSeen }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={chatName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {chatName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground">{chatName}</h3>
          <p className="text-xs text-muted-foreground">
            {isOnline ? 'Online' : lastSeen}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}