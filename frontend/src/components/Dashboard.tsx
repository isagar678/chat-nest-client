import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import { User, MessageSquare, Settings } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || user?.userName}!</h1>
        <p className="text-muted-foreground">Manage your account and start chatting</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar} alt={user?.name} />
                             <AvatarFallback className="bg-primary text-primary-foreground">
                 {user?.name?.split(' ').map((n: string) => n[0]).join('') || user?.userName?.charAt(0) || 'U'}
               </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
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
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/chats')}>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Chats</CardTitle>
              <CardDescription>Start messaging with friends</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send messages, share files, and stay connected
            </p>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Account preferences and security</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure your account settings and preferences
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/chats')}
          className="w-full md:w-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Start Chatting
        </Button>
      </div>
    </div>
  );
};

export default Dashboard
