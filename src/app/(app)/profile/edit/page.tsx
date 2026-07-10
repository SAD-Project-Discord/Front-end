'use client';

import { observer } from 'mobx-react-lite';
import { Box, Typography } from '@mui/material';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import authStore from '@/stores/AuthStore';

function ProfileEditPage() {
  const currentUser = authStore.user;

  const handleUpdateProfile = async (updatedData: any, avatarFile?: File) => {
    // TODO: Wire this up to a new authService method to patch the user profile
    console.log('Sending data to API:', updatedData);
    if (avatarFile) {
      console.log('Uploading new avatar:', avatarFile.name);
    }
  };

  return (
    <Box p={4} sx={{ backgroundColor: '#F5F4FB', minHeight: '100vh' }}>
      <Typography variant="h1" sx={{ mb: 4, textAlign: 'center' }}>Edit Profile</Typography>
      <ProfileEditForm user={currentUser} onSubmit={handleUpdateProfile} />
    </Box>
  );
}

export default observer(ProfileEditPage);