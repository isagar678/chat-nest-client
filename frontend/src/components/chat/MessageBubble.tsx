
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApi } from '@/lib/useApi';
import { Download, File, Image, FileText, Video, Music, Play, Pause, Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  className?: string;
  senderAvatar?: string;
  senderName?: string;
}

export function MessageBubble({ message, showAvatar = true, className, senderAvatar, senderName }: MessageBubbleProps) {
  const { content, timestamp, isSent, filePath, fileName, fileSize, mimeType } = message;
  

  const api = useApi();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleVoicePlay = async () => {
    if (!filePath) return;
    
    try {
      if (!audioUrl) {
        // Get the file URL from the server
        const response = await api.get(`/user/file/${encodeURIComponent(filePath)}`);
        const url = response.data.url;
        setAudioUrl(url);
      }

      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Failed to play voice message:', error);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const isVoiceMessage = mimeType?.startsWith('audio/') || fileName?.includes('voice-message');

  return (
    <div className={cn(
      "flex gap-3 max-w-[70%]",
      isSent ? "ml-auto flex-row-reverse" : "",
      className
    )}>
      {showAvatar && !isSent && (
        <SmartAvatar 
          src={senderAvatar} 
          alt={senderName || 'User'} 
          fallback={senderName}
          size="sm"
          className="flex-shrink-0"
        />
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
          {/* Voice message */}
          {isVoiceMessage && (
            <div className="mb-2 p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Voice Message</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoicePlay}
                      className="h-8 w-8 p-0 bg-blue-500 text-white hover:bg-blue-600"
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full bg-blue-500 transition-all duration-300",
                        isPlaying ? "animate-pulse" : ""
                      )} style={{ width: isPlaying ? '60%' : '0%' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">0:30</span>
                  </div>
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
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              )}
            </div>
          )}

          {/* File attachment (non-voice) */}
          {filePath && !isVoiceMessage && (
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