'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import BookmarkCard from '@/components/BookmarkCard';

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
  const { session, status } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tag = params?.tag as string;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const response = await fetch('/api/bookmarks');
        const data = await response.json();
        setBookmarks(data.filter((b: Bookmark) => b.tags?.includes(tag)));
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchBookmarks();
    }
  }, [session, tag]);

  const handleDelete = async (bookmarkId: string) => {
    try {
      // Update the UI optimistically
      setBookmarks(bookmarks.filter(b => b._id !== bookmarkId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      // If there's an error, we could fetch the bookmarks again
      if (session?.user?.id) {
        const response = await fetch('/api/bookmarks');
        const data = await response.json();
        setBookmarks(data.filter((b: Bookmark) => b.tags?.includes(tag)));
      }
    }
  };

  const sortedBookmarks = [...bookmarks].sort((a: Bookmark, b: Bookmark) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

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
        {isLoading ? (
          <div className="border-4 border-black bg-white p-8 text-center">
            <p className="text-xl font-bold">Loading bookmarks...</p>
          </div>
        ) : sortedBookmarks.length === 0 ? (
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