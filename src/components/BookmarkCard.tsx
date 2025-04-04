'use client';

import Link from 'next/link';
import { useState } from 'react';

interface BookmarkCardProps {
  bookmark: {
    _id: string;
    title: string;
    url: string;
    category: string;
    tags?: string[];
    color?: string;
    createdAt?: string;
  };
  onDelete: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format date if available
  const formattedDate = bookmark.createdAt 
    ? new Date(bookmark.createdAt).toLocaleDateString() 
    : '';

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmark._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      onDelete(bookmark._id);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={`relative mb-6 border-4 border-black ${bookmark.color || 'bg-purple-200'} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]`}>
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-[90%]">
            <h3 className="text-lg font-bold mb-3">Delete Bookmark?</h3>
            <p className="mb-4">Are you sure you want to delete &quot;{bookmark.title}&quot;?</p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 border-2 border-black font-medium hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 border-2 border-black text-white font-medium hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Main content */}
        <div className="flex-grow">
          <Link 
            href={`/read/${bookmark._id}`}
            className="text-lg font-bold hover:underline block mb-2"
          >
            {bookmark.title}
          </Link>

          <a 
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:underline block mb-4"
          >
            {bookmark.url}
          </a>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-sm font-medium">
              {bookmark.category}
            </span>
            {bookmark.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-sm hover:bg-black hover:text-white transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer with date and delete button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/20">
          <span className="text-xs text-gray-500">
            Added on {formattedDate}
          </span>
          <button
            onClick={handleDeleteClick}
            className="text-red-500 hover:text-red-600 transition-colors"
            aria-label="Delete bookmark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}