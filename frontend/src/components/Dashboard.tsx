import { useContext, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import { User, MessageSquare, Heart, Stars, Bell, BellOff, Users } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/utils';

export const Dashboard = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const initials = (user?.name || user?.userName || 'User')
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
    }
  };

  return (
    <div className="relative">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-rose-300/40 blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/40 blur-3xl opacity-60" />
      </div>

      <div className="container mx-auto py-10 px-4 max-w-6xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground ring-1 ring-border">
            <Stars className="h-3.5 w-3.5 text-primary" />
            <span>Welcome to your space</span>
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              Hello, {user?.name || user?.userName || 'there'}
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Pick up conversations, share moments, and connect with your friends in a fresh, lovely pink vibe.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/chats')}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md hover:brightness-110 transition"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Chatting
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* Profile Card */}
          <Card
            className="cursor-pointer border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate('/profile')}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-pink-200">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-pink-500 text-white">
                  {initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-600" />
                  Profile
                </CardTitle>
                <CardDescription>Manage your profile and avatar</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your profile picture, name, and account settings
              </p>
            </CardContent>
          </Card>

          {/* Chats Card */}
          <Card
            className="cursor-pointer border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate('/chats')}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <CardTitle>Private Chats</CardTitle>
                <CardDescription>Start messaging with friends</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Send messages, share files, and stay connected
              </p>
            </CardContent>
          </Card>

          {/* Groups Card */}
          <Card
            className="cursor-pointer border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate('/chats')}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Group Chats</CardTitle>
                <CardDescription>Chat with multiple people</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create groups, add members, and chat together
              </p>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                {notificationPermission === 'granted' ? (
                  <Bell className="h-6 w-6 text-purple-600" />
                ) : (
                  <BellOff className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  {notificationPermission === 'granted' 
                    ? 'Notifications enabled' 
                    : 'Enable message notifications'
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {notificationPermission === 'granted' 
                  ? 'You\'ll receive notifications for new messages'
                  : 'Get notified when you receive new messages'
                }
              </p>
              {notificationPermission !== 'granted' && (
                <Button 
                  onClick={handleEnableNotifications}
                  variant="outline" 
                  size="sm"
                  className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Moments/Feel-good Card */}
          <Card className="border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <CardTitle>Moments</CardTitle>
                <CardDescription>Share love, laughs, and life updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A delightful space designed to make your chats feel warm and friendly.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex items-center justify-center">
          <Button
            onClick={() => navigate('/chats')}
            className="bg-gradient-to-r from-pink-600 to-fuchsia-500 text-white shadow-lg hover:brightness-110 px-6"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Jump into Chats
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard
