'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  return <>{children}</>;
}
