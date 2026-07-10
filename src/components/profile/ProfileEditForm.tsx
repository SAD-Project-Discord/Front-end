'use client';

import { useState } from 'react';
import { Box, Card, Avatar, Typography, Divider, TextField, Button } from '@mui/material';
import type { User } from '@/types/auth';

interface ProfileEditFormProps {
  user: User | null;
  onSubmit: (updatedData: Partial<User>, avatarFile?: File) => void;
}

export default function ProfileEditForm({ user, onSubmit }: ProfileEditFormProps) {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, bio }, selectedFile);
  };

  if (!user) {
    return <Typography variant="body2" align="center">Loading...</Typography>;
  }

  return (
    <Card 
      sx={{ 
        maxWidth: 600, 
        width: '100%', 
        mx: 'auto', 
        p: 4, 
        boxShadow: 'none', 
        border: '1px solid #E2E1E8',
        backgroundColor: '#FFFFFF' 
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={4}>
          <Avatar 
            src={avatarPreview} 
            sx={{ width: 120, height: 120, mb: 2, bgcolor: '#F5F4FB', color: '#9CA3AF' }}
          />
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Upload New Avatar
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
        </Box>
        
        <Divider sx={{ my: 3, borderColor: '#E2E1E8' }} />
        
        <Box mb={3}>
          <TextField 
            label="Display Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            sx={{ mb: 3 }}
          />
          <TextField 
            label="About Me (Bio)" 
            multiline 
            rows={4} 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
          />
        </Box>

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Save Changes
        </Button>
      </form>
    </Card>
  );
}