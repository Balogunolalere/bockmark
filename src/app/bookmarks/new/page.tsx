'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';

interface BookmarkFormData {
  url: string;
  title: string;
  category: string;
  tags: string;
  color?: string;
}

const COLORS = [
  'bg-purple-200',
  'bg-yellow-200',
  'bg-cyan-200',
  'bg-lime-200',
  'bg-pink-200',
  'bg-orange-200',
  'bg-emerald-200',
  'bg-blue-200',
  'bg-rose-200',
  'bg-indigo-200',
];

export default function NewBookmarkPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<BookmarkFormData>({
    url: '',
    title: '',
    category: '',
    tags: '',
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto max-w-2xl">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 1 
              }}
              className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="text-xl font-bold">Loading...</p>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create bookmark');
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating bookmark:', error);
      alert(`Failed to create bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-40 border-b-4 border-black bg-white px-4 sm:px-6 py-4"
        >
          <div className="mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-4xl">
            <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              BLOCKMARK
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="w-full sm:w-auto text-center bg-yellow-200 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                ← Back to Bookmarks
              </Link>
            </motion.div>
          </div>
        </motion.header>

        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border-4 border-black bg-white p-6 sm:p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 text-2xl sm:text-3xl font-bold"
            >
              Add New Bookmark
            </motion.h1>

            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6 sm:space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className="space-y-2"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="url" className="block text-lg font-bold">URL</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="url"
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full border-4 border-black bg-yellow-50 px-4 py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
                  placeholder="https://example.com"
                />
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="title" className="block text-lg font-bold">Title</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-4 border-black bg-yellow-50 px-4 py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
                  placeholder="My Awesome Website"
                />
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label htmlFor="category" className="block text-lg font-bold">Category</label>
                <motion.select
                  whileFocus={{ scale: 1.01 }}
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border-4 border-black bg-yellow-50 px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")` }}
                >
                  <option value="">Select a category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="learning">Learning</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="reference">Reference</option>
                  <option value="social">Social</option>
                  <option value="news">News</option>
                  <option value="other">Other</option>
                </motion.select>
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label htmlFor="tags" className="block text-lg font-bold">Tags</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="tags"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border-4 border-black bg-yellow-50 px-4 py-3 text-base font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
                  placeholder="javascript, programming, web"
                />
                <p className="text-sm text-gray-600">Separate tags with commas</p>
              </motion.div>

              <motion.div 
                className="space-y-3"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-lg font-bold">Card Color</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                  {COLORS.map((color, index) => (
                    <motion.button
                      key={color}
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-12 w-full border-4 border-black transition-all duration-150 ease-in-out ${color} ${
                        formData.color === color
                          ? 'ring-4 ring-black ring-offset-2 shadow-none translate-x-[1px] translate-y-[1px]'
                          : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                      aria-label={`Select ${color.replace('bg-', '').replace('-200', '')} color`}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 order-2 sm:order-1 border-4 border-black bg-lime-400 px-8 py-3 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Bookmark'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto order-1 sm:order-2 border-4 border-black bg-yellow-200 px-8 py-3 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Cancel
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}