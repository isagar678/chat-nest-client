
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApi } from '@/lib/useApi';
import { Download, File, Image, FileText, Video, Music } from 'lucide-react';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({ message, showAvatar = true, className }: MessageBubbleProps) {
  const { content, timestamp, isSent, filePath, fileName, fileSize, mimeType, fileUrl } = message;
  const api = useApi();

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (mimeType.startsWith('text/') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileDownload = async () => {
    if (!filePath) return;
    
    try {
      // Get the file URL from the server
      const response = await api.get(`/user/file/${encodeURIComponent(filePath)}`);
      const url = response.data.url;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  return (
    <div className={cn(
      "flex gap-3 max-w-[70%]",
      isSent ? "ml-auto flex-row-reverse" : "",
      className
    )}>
      {showAvatar && !isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            U
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col gap-1",
        isSent ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl max-w-full break-words",
          isSent 
            ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md" 
            : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md"
        )}>
          {/* File attachment */}
          {filePath && (
            <div className="mb-2 p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2">
                {getFileIcon(mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName || 'File'}</p>
                  {fileSize && (
                    <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileDownload}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Message content */}
          {content && <p className="text-sm leading-relaxed">{content}</p>}
        </div>

        <div className={cn(
          "flex items-center gap-1 px-2",
          isSent ? "flex-row-reverse" : ""
        )}>
          <span className="text-xs text-muted-foreground">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}