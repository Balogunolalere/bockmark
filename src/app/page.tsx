'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  color?: string;
}

export default function Home() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [randomBookmark, setRandomBookmark] = useState<Bookmark | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null); // State for confirmation modal
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

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
        // Ensure data is an array before setting it
        const bookmarkArray = Array.isArray(data) ? data : [];
        setBookmarks(bookmarkArray);
        // Set a random bookmark for the widget if there are any bookmarks
        if (bookmarkArray.length > 0) {
          setRandomBookmark(bookmarkArray[Math.floor(Math.random() * bookmarkArray.length)]);
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchBookmarks();
    }
  }, [session]);

  const handleFavoriteToggle = async (bookmarkId: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookmarkId,
          isFavorite: !currentValue,
        }),
      });

      if (response.ok) {
        setBookmarks(bookmarks.map(b => 
          b._id === bookmarkId ? { ...b, isFavorite: !currentValue } : b
        ));
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleDeleteClick = (bookmarkId: string) => {
    setShowDeleteConfirmId(bookmarkId); // Show confirmation for this bookmark
  };

  const cancelDelete = () => {
    setShowDeleteConfirmId(null); // Hide confirmation
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirmId) return;

    setIsDeleting(true);
    const bookmarkIdToDelete = showDeleteConfirmId;

    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkIdToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      // Update the UI optimistically
      setBookmarks(bookmarks.filter(b => b._id !== bookmarkIdToDelete));
      // Update random bookmark if it was the one deleted
      if (randomBookmark?._id === bookmarkIdToDelete) {
        const remainingBookmarks = bookmarks.filter(b => b._id !== bookmarkIdToDelete);
        setRandomBookmark(remainingBookmarks.length > 0 ? remainingBookmarks[Math.floor(Math.random() * remainingBookmarks.length)] : null);
      }

    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
      // Optionally refetch bookmarks on error
      // if (session?.user?.id) {
      //   fetchBookmarks();
      // }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmId(null); // Hide confirmation after operation
    }
  };

  // Get unique categories for the navigation, ensuring bookmarks is treated as an array
  const categories = Array.from(new Set(bookmarks?.map?.(b => b?.category) ?? [])).filter(Boolean);

  // Filter bookmarks based on active filter and search query
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesFilter = 
      activeFilter === 'all' ||
      activeFilter === 'favorites' && bookmark.isFavorite ||
      bookmark.category === activeFilter;

    const matchesSearch = 
      searchQuery === '' ||
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-4 border-black bg-white px-4 sm:px-6 py-4">
        <div className="mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">BLOCKMARK</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
            <div className="relative w-full sm:w-64">
              <input
                type="search"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-4 border-black bg-white px-4 py-2 pr-10 text-base font-medium focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                🔍
              </span>
            </div>
            <div className="flex gap-3 sm:gap-6">
              <Link
                href="/bookmarks/new"
                className="flex-1 sm:flex-none text-center bg-lime-400 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                + Add Bookmark
              </Link>
              <button
                onClick={() => signOut()}
                className="flex-1 sm:flex-none text-center bg-yellow-200 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-8">
            <div className="border-4 border-black bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-xl font-bold">Collections</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`w-full border-4 border-black px-4 py-2 text-left font-bold transition-colors ${
                    activeFilter === 'all' ? 'bg-cyan-400' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  All Bookmarks
                </button>
                <button
                  onClick={() => setActiveFilter('favorites')}
                  className={`w-full border-4 border-black px-4 py-2 text-left font-bold transition-colors ${
                    activeFilter === 'favorites' ? 'bg-cyan-400' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  Favorites ★
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`w-full border-4 border-black px-4 py-2 text-left font-bold capitalize transition-colors ${
                      activeFilter === category ? 'bg-cyan-400' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>

            {randomBookmark && (
              <div className="border-4 border-black bg-purple-200 p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-bold">Random Pick</h2>
                <div className="border-4 border-black bg-white p-4">
                  <h3 className="mb-2 font-bold line-clamp-2">{randomBookmark.title}</h3>
                  <a
                    href={randomBookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline hover:text-blue-800 line-clamp-1"
                  >
                    Visit site →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="border-4 border-black bg-white p-8 text-center">
                <p className="text-xl font-bold">Loading bookmarks...</p>
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="border-4 border-black bg-white p-8 text-center">
                <p className="text-xl font-bold">No bookmarks found</p>
                <Link
                  href="/bookmarks/new"
                  className="mt-4 inline-block bg-lime-400 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Add Your First Bookmark
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark._id}
                    className={`relative group border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${bookmark.color || 'bg-white'}`}
                  >
                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirmId === bookmark._id && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-[90%]">
                          <h3 className="mb-3 text-lg font-bold">Delete Bookmark?</h3>
                          <p className="mb-4">Are you sure you want to delete &quot;{bookmark.title}&quot;?</p>
                          <div className="flex space-x-3">
                            <button
                              onClick={cancelDelete}
                              className="border-2 border-black bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300"
                              disabled={isDeleting}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={confirmDelete}
                              className="border-2 border-black bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        onClick={() => handleFavoriteToggle(bookmark._id, bookmark.isFavorite)}
                        className="text-xl"
                        aria-label={bookmark.isFavorite ? 'Unmark as favorite' : 'Mark as favorite'}
                      >
                        {bookmark.isFavorite ? '★' : '☆'}
                      </button>
                      {/* Group Read and Delete buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/read/${bookmark._id}`}
                          className="bg-cyan-400 border-2 border-black px-2 py-1 text-sm font-bold hover:bg-cyan-500 transition-colors"
                        >
                          Read →
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(bookmark._id)}
                          className="bg-red-500 border-2 border-black p-1 text-white hover:bg-red-600 transition-colors"
                          aria-label="Delete bookmark"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <Link href={`/read/${bookmark._id}`}>
                      <h3 className="mb-2 text-xl font-bold">{bookmark.title}</h3>
                    </Link>
                    <div className="mb-4 space-x-2">
                      {bookmark.tags?.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${tag}`}
                          className="mr-2 mb-2 inline-block border-2 border-black bg-gray-100 px-2 py-1 text-sm font-medium hover:bg-yellow-100"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-gray-600">
                        {bookmark.category}
                      </span>
                      <span className="text-gray-500">
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
