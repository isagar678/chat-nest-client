import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Mic, MicOff, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Picker from 'emoji-picker-react';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  onTyping?: (isTyping: boolean) => void;
  className?: string;
  placeholder?: string;
  isUploading?: boolean;
}

export function ChatInput({
  onSendMessage,
  onTyping,
  className,
  placeholder = "Type a message...",
  isUploading
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleEmojiClick = (emojiObject: any) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  };

  // Create a preview URL when a file is selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    // Only create previews for images
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Clean up the object URL when the component unmounts or the file changes
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  // Cleanup function for recording
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop recording after 5 minutes
          if (newTime >= 300) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event:', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
      setFile(selectedFile);
    }
  };

  const handleSend = () => {
    if (!message.trim() && !file && !audioBlob) return;

    // Convert audio blob to file if we have a recording
    let fileToSend = file;
    if (audioBlob && !file) {
      fileToSend = new File([audioBlob], `voice-message-${Date.now()}.wav`, {
        type: 'audio/wav'
      });
    }

    onSendMessage(message.trim(), fileToSend || undefined);
    setMessage('');
    setFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
    };
    
    // Stop typing indicator when sending
    if (onTyping) {
      onTyping(false);
    }
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Handle typing indicators
    if (onTyping) {
      if (newMessage.trim()) {
        onTyping(true);

        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }

        // Set new timeout to stop typing indicator after 1 second of no input
        const timeout = setTimeout(() => {
          onTyping(false);
          setTypingTimeout(null);
        }, 1000);

        setTypingTimeout(timeout);
      } else {
        onTyping(false);
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    if ((e.key === 'Enter' && !e.shiftKey) || (isCmdOrCtrl && e.key.toLowerCase() === 'enter')) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        (event.target as HTMLElement).tagName !== 'BUTTON' // This line prevents the button click from closing the picker immediately
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Paste to attach files support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const fileItem = items.find((item) => item.kind === 'file');
      if (fileItem) {
        const pastedFile = fileItem.getAsFile();
        if (pastedFile) {
          setFile(pastedFile);
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  // Drag and drop to attach
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={cn("p-4 border-t border-border bg-background relative", className)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* File preview */}
      {file && (
        <div className="relative mb-2 p-2 border rounded-lg w-fit">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-24 rounded-md" />
          ) : (
            <p className="text-sm text-muted-foreground">{file.name}</p>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Audio preview */}
      {audioBlob && audioUrl && (
        <div className="relative mb-2 p-3 border rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Voice Message</p>
              <p className="text-xs text-muted-foreground">{formatTime(recordingTime)}</p>
            </div>
            <audio controls className="h-8" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
              onClick={removeAudio}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="mb-2 p-3 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Recording...</p>
              <p className="text-xs text-red-600">{formatTime(recordingTime)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-red-500 text-white hover:bg-red-600"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-gray-500 text-white hover:bg-gray-600"
              onClick={cancelRecording}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          className="hidden"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 flex-shrink-0"
          onClick={() => {
            console.log('Paperclip button clicked');
            console.log('File input ref:', fileInputRef.current);
            fileInputRef.current?.click();
          }}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none pr-20 py-3"
            rows={1}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8",
                isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""
              )}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!audioBlob} // Disable if we already have a recording
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-10" ref={emojiPickerRef}>
              <Picker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !file && !audioBlob) || isUploading}
          className="h-10 w-10 p-0 flex-shrink-0"
        >
          {isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isDraggingOver && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-md flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm font-medium">Drop files to attach</p>
            <p className="text-xs text-muted-foreground">Images, videos, audio, documents</p>
          </div>
        </div>
      )}
    </div>
  );
}