'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { isAuthenticated } from '@/lib/auth';
import { SectionNavRail } from '@/components/nav/SectionNavRail';
import ProfileModalHost from '@/components/profile/ProfileModalHost';
import ContactRealtimeSync from '@/components/contacts/ContactRealtimeSync';

const SECTIONS_WITH_RAIL = ['/dm', '/contacts', '/groups', '/channels'];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Deliberately not a lazy useState initializer: this component *is*
    // server-rendered (as `null`, since `authorized` starts false), so
    // flipping to `true` must happen post-hydration via an effect — an
    // initializer that reads localStorage would return `true` on the
    // client's first pass and mismatch the server's `null` output.
    if (isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthorized(true);
    } else {
      router.replace('/login');
    }
  }, [router, setAuthorized]);

  if (!authorized) return null;

  const showRail = SECTIONS_WITH_RAIL.some((section) => pathname?.startsWith(section));

  return (
    <>
      {showRail ? (
        <Box sx={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden' }}>
          <SectionNavRail />
          <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>{children}</Box>
        </Box>
      ) : (
        children
      )}
      <ProfileModalHost />
      <ContactRealtimeSync />
    </>
  );
}
