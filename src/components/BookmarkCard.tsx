'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { delay: 0.1, duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    disabled: { 
      opacity: 0.5,
      cursor: "not-allowed"
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative mb-6 border-4 border-black ${bookmark.color || 'bg-purple-200'} p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
    >
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 p-4"
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-[90%]"
            >
              <motion.h3 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold mb-3"
              >
                Delete Bookmark?
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-4 break-words"
              >
                Are you sure you want to delete &quot;{bookmark.title}&quot;?
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  animate={isDeleting ? "disabled" : ""}
                  onClick={cancelDelete}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 border-2 border-black font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  animate={isDeleting ? "disabled" : ""}
                  onClick={confirmDelete}
                  className="w-full sm:w-auto px-4 py-2 bg-red-500 border-2 border-black text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      Deleting...
                    </motion.span>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-3">
            <Link 
              href={`/read/${bookmark._id}`}
              className="text-lg font-bold hover:underline line-clamp-2 flex-1"
            >
              {bookmark.title}
            </Link>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/read/${bookmark._id}`}
                  className="bg-cyan-400 border-2 border-black px-2 py-1 text-sm font-bold hover:bg-cyan-500 transition-colors"
                >
                  Read
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteClick}
                className="flex-shrink-0 bg-red-500 border-2 border-black p-1 text-white hover:bg-red-600 transition-colors"
                aria-label="Delete bookmark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </div>

          <a 
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:underline block mb-4 line-clamp-1"
          >
            {bookmark.url}
          </a>

          <div className="flex flex-wrap gap-2 mb-4">
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-sm font-medium"
            >
              {bookmark.category}
            </motion.span>
            {bookmark.tags?.map((tag) => (
              <motion.div key={tag} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/tags/${tag}`}
                  className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-sm hover:bg-black hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/20">
          <span className="text-xs text-gray-500">
            Added on {formattedDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
}