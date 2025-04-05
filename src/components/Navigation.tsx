'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      redirect: false
    });
    router.refresh();
    router.replace('/auth/signin');
  };

  const navItemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.05 }
  };

  const listVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-3 bg-white border-b-4 border-black mb-8"
    >
      <motion.ul 
        className="flex items-center gap-6 max-w-7xl mx-auto"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <motion.li variants={navItemVariants} whileHover="hover">
          <Link 
            href="/" 
            className={`font-medium ${pathname === '/' ? 'text-cyan-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Home
          </Link>
        </motion.li>
        <motion.li variants={navItemVariants} whileHover="hover">
          <Link 
            href="/bookmarks" 
            className={`font-medium ${pathname === '/bookmarks' ? 'text-cyan-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Bookmarks
          </Link>
        </motion.li>
        <motion.li variants={navItemVariants} whileHover="hover">
          <Link 
            href="/recent" 
            className={`font-medium ${pathname === '/recent' ? 'text-cyan-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Recent
          </Link>
        </motion.li>
        {session ? (
          <>
            <motion.li variants={navItemVariants} whileHover="hover">
              <Link 
                href="/bookmarks/new"
                className={`font-medium ${pathname === '/bookmarks/new' ? 'text-cyan-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                New Bookmark
              </Link>
            </motion.li>
            <motion.li variants={navItemVariants} whileHover="hover">
              <motion.button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white font-medium border-2 border-black hover:bg-red-600"
                whileTap={{ scale: 0.95 }}
              >
                Sign Out
              </motion.button>
            </motion.li>
          </>
        ) : (
          <motion.li variants={navItemVariants} whileHover="hover">
            <Link 
              href="/auth/signin"
              className={`font-medium ${pathname === '/auth/signin' ? 'text-cyan-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sign In
            </Link>
          </motion.li>
        )}
      </motion.ul>
    </motion.nav>
  );
}