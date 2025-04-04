import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session) {
      setIsAuthenticated(true);
      setIsLoading(false);
      router.refresh(); // Refresh the current page to update data
    }
  }, [status, session, router]);

  return { session, isAuthenticated, isLoading, status };
}