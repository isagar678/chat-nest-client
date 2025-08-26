
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApi } from '@/lib/useApi';
import { Download, File, Image, FileText, Video, Music, Play, Pause, Volume2, Check, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  className?: string;
  senderAvatar?: string;
  senderName?: string;
}

export function MessageBubble({ message, showAvatar = true, className, senderAvatar, senderName }: MessageBubbleProps) {
  const { content, timestamp, isSent, filePath, fileName, fileSize, mimeType, isDelivered, isRead } = message;
  

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
      // Get the file URL from the server; preserve path slashes for wildcard route
      const encodedPath = encodeURI(filePath);
      const response = await api.get(`/user/file/${encodedPath}`);
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
      // If we don't yet have a URL, fetch it and flip playing state; the effect below will start playback
      if (!audioUrl) {
        const encodedPath = encodeURI(filePath);
        const response = await api.get(`/user/file/${encodedPath}`);
        const url = response.data.url;
        setAudioUrl(url);
        setIsPlaying(true);
        return;
      }

      // If we have a URL, toggle play/pause on the existing audio element
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Failed to play voice message:', error);
    }
  };

  // Auto-start/stop playback when audio URL becomes available or playing state changes
  useEffect(() => {
    if (!audioUrl) return;
    if (!audioRef.current) return;
    const el = audioRef.current;
    if (isPlaying) {
      el.play().catch(() => {
        // Swallow autoplay errors; user interaction already happened
      });
    } else {
      try { el.pause(); } catch {}
    }
  }, [audioUrl, isPlaying]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const isVoiceMessage = mimeType?.startsWith('audio/') || fileName?.includes('voice-message');
  const isImage = useMemo(() => {
    if (mimeType?.startsWith('image/')) return true;
    if (!mimeType && fileName) {
      const lower = fileName.toLowerCase();
      return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp');
    }
    return false;
  }, [mimeType, fileName]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (!filePath || !isImage) return;
      try {
        const response = await api.get(`/user/file/${encodeURIComponent(filePath)}`);
        setImageUrl(response.data.url);
      } catch (e) {
        // Fallback: leave as null so regular attachment UI shows
        console.error('Failed to fetch image URL:', e);
      }
    };
    fetchImageUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, isImage]);

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
            ? "bg-primary text-primary-foreground rounded-br-md shadow-sm" 
            : "bg-secondary text-secondary-foreground rounded-bl-md shadow-sm"
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
              {/* Keep audio element in the tree once created so ref is stable */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  preload="auto"
                  className="hidden"
                />
              )}
            </div>
          )}

          {/* Inline image preview */}
          {filePath && !isVoiceMessage && isImage && imageUrl && (
            <div className="mb-2">
              <img
                src={imageUrl}
                alt={fileName || 'image'}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => window.open(imageUrl || '#', '_blank')}
              />
            </div>
          )}

          {/* File attachment (non-voice, non-image or when preview unavailable) */}
          {filePath && !isVoiceMessage && (!isImage || !imageUrl) && (
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
          "flex items-center gap-1 px-2 min-h-4",
          isSent ? "flex-row-reverse" : ""
        )}>
          <span className="text-xs text-muted-foreground">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          {isSent && (
            <span className="ml-1 text-muted-foreground">
              {isRead ? (
                <CheckCheck className="h-4 w-4 text-blue-500" />
              ) : isDelivered ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}