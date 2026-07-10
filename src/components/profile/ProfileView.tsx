'use client';

import { Box, Card, Avatar, Typography, Divider } from '@mui/material';
import type { User } from '@/types/auth';

interface ProfileViewProps {
  user: User | null;
}

export default function ProfileView({ user }: ProfileViewProps) {
  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body2">Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Card 
      sx={{ 
        maxWidth: 600, 
        width: '100%', 
        mx: 'auto', 
        mt: 4, 
        p: 4, 
        boxShadow: 'none', 
        border: '1px solid #E2E1E8', // Matches palette.border
        backgroundColor: '#FFFFFF' // Matches palette.surface
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={4}>
        <Avatar 
          src={user.avatar_url} 
          alt={user.name} 
          sx={{ 
            width: 120, 
            height: 120, 
            mb: 2, 
            bgcolor: '#F5F4FB', // Matches palette.backdrop
            color: '#9CA3AF'    // Matches palette.slateLight
          }}
        />
        <Typography variant="h1">{user.name}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
          @{user.username}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 3, borderColor: '#E2E1E8' }} />
      
      <Box mb={3}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#15161A', mb: 1 }}>
          About Me
        </Typography>
        <Typography variant="body2">
          {user.bio || 'This user has no bio yet.'}
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#15161A', mb: 1 }}>
          Contact
        </Typography>
        <Typography variant="body2">{user.email}</Typography>
      </Box>
    </Card>
  );
}