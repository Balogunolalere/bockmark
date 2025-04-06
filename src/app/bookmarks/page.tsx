'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import BookmarkCard from '@/components/BookmarkCard';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import useSWR from 'swr';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  category: string;
  tags?: string[];
  color?: string;
  createdAt: string;
}

export default function BookmarksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: bookmarks = [], isLoading: bookmarksLoading, mutate } = useSWR<Bookmark[]>(
    isAuthenticated ? '/api/bookmarks' : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // Dedupe requests within 1 minute
    }
  );

  const handleDelete = async (deletedId: string) => {
    // Optimistically update UI
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark._id !== deletedId);
    mutate(updatedBookmarks, false);
  };

  if (authLoading || bookmarksLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <LoadingAnimation size="lg" text="Loading bookmarks..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-40 border-b-4 border-black bg-white px-6 py-4"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="text-4xl font-black tracking-tight">
              BLOCKMARK
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/bookmarks/new"
                className="bg-lime-400 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                + Add Bookmark
              </Link>
            </motion.div>
          </div>
        </motion.header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {bookmarks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="text-xl font-bold">No bookmarks yet</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/bookmarks/new"
                  className="mt-4 inline-block bg-lime-400 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Add Your First Bookmark
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {bookmarks.map((bookmark) => (
                <BookmarkCard 
                  key={bookmark._id} 
                  bookmark={bookmark}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}