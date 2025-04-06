'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import BookmarkCard from '@/components/BookmarkCard';
import { PageTransition } from '@/components/ui/PageTransition';
import LoadingAnimation from '@/components/ui/LoadingAnimation';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export default function RecentPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'24h' | 'week' | 'month' | 'all'>('24h');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      const data = await response.json();
      setBookmarks(data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    try {
      // Update the UI optimistically
      setBookmarks(bookmarks.filter(b => b._id !== bookmarkId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      // If there's an error, we could fetch the bookmarks again
      if (isAuthenticated) {
        fetchBookmarks();
      }
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  if (isLoading || loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <LoadingAnimation size="lg" text="Loading recent bookmarks..." />
        </div>
      </PageTransition>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const createdAt = new Date(bookmark.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const hours = diff / (1000 * 60 * 60);

    switch (timeFilter) {
      case '24h':
        return hours <= 24;
      case 'week':
        return hours <= 168; // 7 days
      case 'month':
        return hours <= 720; // 30 days
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b-4 border-black bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-4xl font-black tracking-tight text-black">BLOCKMARK</h1>
          <div className="flex items-center space-x-6">
            <Link
              href="/bookmarks/new"
              className="bg-lime-400 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              + Add Bookmark
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-yellow-200 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 border-4 border-black bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Bookmarks</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeFilter('24h')}
                className={`border-4 border-black px-4 py-2 font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                  timeFilter === '24h'
                    ? 'bg-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                Last 24h
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`border-4 border-black px-4 py-2 font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                  timeFilter === 'week'
                    ? 'bg-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`border-4 border-black px-4 py-2 font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                  timeFilter === 'month'
                    ? 'bg-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`border-4 border-black px-4 py-2 font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                  timeFilter === 'all'
                    ? 'bg-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {filteredBookmarks.length === 0 ? (
          <div className="border-4 border-black bg-white p-8 text-center">
            <p className="text-xl font-bold">No bookmarks found for this time period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark._id}
                bookmark={bookmark}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}