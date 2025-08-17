export const refreshAvatarUrl = async (currentUrl: string): Promise<string | null> => {
  try {
    // Create a direct fetch request instead of using the hook
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      return null;
    }

    const response = await fetch('http://localhost:3000/user/avatar/refresh-url', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.avatarUrl;
  } catch (error) {
    console.error('Failed to refresh avatar URL:', error);
    return null;
  }
};

export const handleAvatarError = async (
  currentUrl: string,
  onRefresh: (newUrl: string) => void
): Promise<void> => {
  try {
    const newUrl = await refreshAvatarUrl(currentUrl);
    if (newUrl) {
      onRefresh(newUrl);
    }
  } catch (error) {
    console.error('Error handling avatar error:', error);
  }
};
