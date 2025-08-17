import React, { useState, useEffect } from 'react';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AvatarTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testStorage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/user/test/storage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAvatars = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/user/test/avatars', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testFriends = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/user/my/friends', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Avatar Test Page</h1>
      
      <div className="grid gap-4">
        <Button onClick={testStorage} disabled={loading}>
          Test Storage Configuration
        </Button>
        
        <Button onClick={testAvatars} disabled={loading}>
          Test Avatar Data
        </Button>
        
        <Button onClick={testFriends} disabled={loading}>
          Test Friends Data
        </Button>
      </div>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Avatar Display Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <SmartAvatar 
              src="https://example.com/nonexistent.jpg" 
              alt="Test Avatar" 
              fallback="Test User"
              size="lg"
            />
            <span>This should show initials when image fails to load</span>
          </div>
          
          <div className="flex items-center gap-4">
            <SmartAvatar 
              src={null} 
              alt="No Avatar" 
              fallback="No Image"
              size="lg"
            />
            <span>This should show initials for no image</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
