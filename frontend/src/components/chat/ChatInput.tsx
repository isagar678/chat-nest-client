import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Picker from 'emoji-picker-react';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  onTyping?: (isTyping: boolean) => void;
  className?: string;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onTyping,
  className,
  placeholder = "Type a message..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event:', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
      setFile(selectedFile);
    }
  };

  const handleSend = () => {
    if (!message.trim() && !file) return;

    onSendMessage(message.trim(), file || undefined);
    setMessage('');
    setFile(null);
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
    if (e.key === 'Enter' && !e.shiftKey) {
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

  return (
    <div className={cn("p-4 border-t border-border bg-background", className)}>
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-4 w-4" />
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
          disabled={!message.trim() && !file}
          className="h-10 w-10 p-0 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}