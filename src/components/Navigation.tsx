'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      redirect: false
    });
    router.refresh();  // Refresh to update session state
    router.replace('/auth/signin');  // Use replace instead of push to prevent back navigation
  };

  return (
    <nav>
      <ul>
        <li>
          <Link href="/">
            <a className={pathname === '/' ? 'active' : ''}>Home</a>
          </Link>
        </li>
        <li>
          <Link href="/about">
            <a className={pathname === '/about' ? 'active' : ''}>About</a>
          </Link>
        </li>
        {session ? (
          <>
            <li>
              <Link href="/profile">
                <a className={pathname === '/profile' ? 'active' : ''}>Profile</a>
              </Link>
            </li>
            <li>
              <button onClick={handleSignOut}>Sign Out</button>
            </li>
          </>
        ) : (
          <li>
            <Link href="/auth/signin">
              <a className={pathname === '/auth/signin' ? 'active' : ''}>Sign In</a>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}