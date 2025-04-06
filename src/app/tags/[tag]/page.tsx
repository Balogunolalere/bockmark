'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import BookmarkCard from '@/components/BookmarkCard';
import { PageTransition } from '@/components/ui/PageTransition';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import useSWR from 'swr';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export default function TagPage() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useParams();
  const tag = params?.tag as string;
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const { data: allBookmarks = [], isLoading, mutate } = useSWR<Bookmark[]>(
    status === 'authenticated' ? '/api/bookmarks' : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000
    }
  );

  // Filter bookmarks with the current tag
  const bookmarks = allBookmarks.filter((b: Bookmark) => b.tags?.includes(tag));

  const handleDelete = async (bookmarkId: string) => {
    try {
      // Optimistically update the UI
      const updatedBookmarks = allBookmarks.filter((b: Bookmark) => b._id !== bookmarkId);
      mutate(updatedBookmarks, false);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      // Revert on error
      mutate();
    }
  };

  const sortedBookmarks = [...bookmarks].sort((a: Bookmark, b: Bookmark) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <LoadingAnimation size="lg" text="Loading tagged bookmarks..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b-4 border-black bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="bg-white border-4 border-black p-2 text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              ←
            </Link>
            <h1 className="text-2xl font-bold">#{tag}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('date')}
                className={`border-4 border-black px-4 py-2 font-bold text-base transition-all ${
                  sortBy === 'date'
                    ? 'bg-cyan-200 translate-x-[2px] translate-y-[2px] shadow-none'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`border-4 border-black px-4 py-2 font-bold text-base transition-all ${
                  sortBy === 'title'
                    ? 'bg-cyan-200 translate-x-[2px] translate-y-[2px] shadow-none'
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                }`}
              >
                Title
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Bookmarks Grid */}
        {sortedBookmarks.length === 0 ? (
          <div className="border-4 border-black bg-white p-8 text-center">
            <p className="text-xl font-bold">No bookmarks found with this tag</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedBookmarks.map((bookmark) => (
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