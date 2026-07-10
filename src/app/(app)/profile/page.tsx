'use client';

import { observer } from 'mobx-react-lite';
import { Box } from '@mui/material';
import ProfileView from '@/components/profile/ProfileView';
import authStore from '@/stores/AuthStore';

function MyProfilePage() {
  // authStore.user contains the currently authenticated user
  const currentUser = authStore.user;

  return (
    <Box p={4} sx={{ backgroundColor: '#F5F4FB', minHeight: '100vh' }}>
      <ProfileView user={currentUser} />
    </Box>
  );
}

// Wrap the export in observer so it reacts to MobX state changes
export default observer(MyProfilePage);