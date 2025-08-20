import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/useApi';
import AuthContext from '@/context/AuthContext';
import { User, Settings, Save, Loader2 } from 'lucide-react';
import { getServerUrl } from '@/lib/utils';

interface UserProfile {
  id: number;
  name: string;
  userName: string;
  email: string;
  avatar?: string;
  role: string;
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: ''
  });
  const { toast } = useToast();
  const api = useApi();
  const auth = useContext(AuthContext);

  console.log('AuthContext user:', auth?.user);
  console.log('AuthContext accessToken:', auth?.accessToken);

  useEffect(() => {
    console.log('Profile component mounted, fetching profile...');
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data;
      console.log('Profile data received:', userData);
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        userName: userData.userName || '',
        email: userData.email || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // Fallback to auth context user data if available
      if (auth?.user) {
        console.log('Using auth context user data as fallback');
        setProfile(auth.user);
        setFormData({
          name: auth.user.name || '',
          userName: auth.user.userName || '',
          email: auth.user.email || ''
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await api.put('/user/profile', { name: formData.name });
      setProfile(prev => prev ? { ...prev, name: result.data.name } : result.data);
      if (auth?.refreshUserData) {
        await auth.refreshUserData();
      }
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile information.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!auth?.accessToken) {
      toast({
        title: "Error",
        description: "You must be logged in to update your avatar.",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      // Handle avatar removal
      try {
        const response = await fetch(`${getServerUrl()}/user/avatar/remove`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`,
          },
        });

        if (response.ok) {
          if (profile) {
            setProfile({
              ...profile,
              avatar: undefined
            });
          }
          toast({
            title: "Avatar removed",
            description: "Your profile picture has been removed successfully.",
          });
        } else {
          throw new Error('Failed to remove avatar');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to remove avatar.",
          variant: "destructive",
        });
      }
      return;
    }

    // Handle avatar upload
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${getServerUrl()}/user/avatar/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (profile) {
          setProfile({
            ...profile,
            avatar: result.avatarUrl
          });
        }
        
        // Refresh the AuthContext user data to include the new avatar
        if (auth?.refreshUserData) {
          await auth.refreshUserData();
        }
        
        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated successfully.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a new profile picture. Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatar={profile.avatar}
              userName={profile.name || profile.userName || 'User'}
              onAvatarChange={handleAvatarChange}
              size="lg"
              className="mx-auto"
            />
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                placeholder="Enter your username"
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed for security reasons
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <Input
                value={profile.role}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Logout</h4>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => auth?.logout()}
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
