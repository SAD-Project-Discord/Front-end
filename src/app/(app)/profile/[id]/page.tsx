'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import ProfileView from '@/components/profile/ProfileView';
import api from '@/lib/axios';
import type { User } from '@/types/auth';

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Assuming your backend exposes a public endpoint to fetch a user by ID
        const response = await api.get(`/users/${userId}`);
        
        // Adjust the data mapping here based on your actual API response structure
        setUser(response.data.user || response.data);
      } catch (err) {
        console.error(err);
        setError('User not found or an error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (error) {
    return (
      <Box p={4} sx={{ backgroundColor: '#F5F4FB', minHeight: '100vh', display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ backgroundColor: '#F5F4FB', minHeight: '100vh' }}>
      {loading ? (
        <Typography align="center" variant="body1" sx={{ mt: 10 }}>Loading profile...</Typography>
      ) : (
        <ProfileView user={user} />
      )}
    </Box>
  );
}