'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import type { IBookmark } from '@/lib/db/models/bookmark';

export default function ReaderPage() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const [iframeError, setIframeError] = useState(false);

  // Create the debounced function using useCallback
  const debouncedUpdateProgress = useCallback((newProgress: number) => {
    fetch('/api/bookmarks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, progress: newProgress }),
    }).catch(error => {
      console.error('Error updating progress:', error);
    });
  }, [id]);

  // Wrap the debounced function
  const debouncedProgressUpdate = useMemo(
    () => debounce(debouncedUpdateProgress, 1000),
    [debouncedUpdateProgress]
  );

  // Clean up the debounced function when the component unmounts
  useEffect(() => {
    return () => {
      debouncedProgressUpdate.cancel();
    };
  }, [debouncedProgressUpdate]);

  const { data: bookmark, isLoading, error: fetchError } = useSWR<IBookmark>(
    status === 'authenticated' ? `/api/bookmarks?id=${id}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin');
          return null;
        }
        throw new Error('Failed to fetch bookmark');
      }
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000
    }
  );

  const [progress, setProgress] = useState(bookmark?.progress ?? 0);

  // Track scroll position to update progress
  useEffect(() => {
    if (!bookmark?.content) return;

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    const handleScroll = () => {
      const article = articleContent.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the article is above the viewport
      const articleAbove = -article.top;
      // Total scrollable height of the article
      const totalScrollable = article.height - windowHeight;
      
      // Calculate scroll percentage
      if (totalScrollable > 0) {
        const scrollPercentage = Math.min(
          100,
          Math.max(0, Math.round((articleAbove / totalScrollable) * 100))
        );
        
        // Only update if changed by at least 5%
        if (Math.abs(scrollPercentage - progress) >= 5) {
          setProgress(scrollPercentage);
          debouncedProgressUpdate(scrollPercentage);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      debouncedProgressUpdate.cancel();
    };
  }, [bookmark?.content, progress, debouncedProgressUpdate]);

  // Restore scroll position when content loads
  useEffect(() => {
    if (!bookmark?.content) return;

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    // Wait for content to be fully rendered
    requestAnimationFrame(() => {
      const article = articleContent.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = article.height - windowHeight;
      
      // Calculate scroll position based on saved progress
      const scrollPosition = ((bookmark.progress ?? 0) / 100) * totalScrollable;
      window.scrollTo({
        top: scrollPosition,
        behavior: 'instant' // Use instant to prevent jarring animation on load
      });
    });
  }, [bookmark?.content, bookmark?.progress]);

  // Parse the error message from the content if it contains one
  const parseContentError = useCallback(() => {
    if (!bookmark?.content) return null;
    
    if (bookmark.content.includes('Error Fetching Content') || 
        bookmark.content.includes('Could not retrieve or parse')) {
      
      const errorCodeMatch = bookmark.content.match(/Reason: ([A-Z_]+)/i);
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : undefined;
      
      return {
        message: 'Could not retrieve or parse the content from the URL.',
        code: errorCode
      };
    }
    
    return null;
  }, [bookmark]);
  
  const contentError = parseContentError();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <div className="mx-auto max-w-3xl w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <LoadingAnimation size="lg" text="Loading article..." />
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (fetchError) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <div className="mx-auto max-w-3xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ErrorDisplay 
                title="Failed to Load Bookmark"
                message={fetchError.message}
                errorCode={fetchError.code}
                showHomeButton={true}
              />
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!bookmark) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <div className="mx-auto max-w-3xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ErrorDisplay 
                title="Bookmark Not Found"
                message="We couldn't find the bookmark you're looking for."
                showHomeButton={true}
              />
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 z-50 w-full bg-white border-b-4 border-black">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="bg-pink-200 border-4 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                ←
              </Link>
              <h1 className="font-bold text-lg line-clamp-1">{bookmark.title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:block bg-purple-200 border-4 border-black px-3 py-1 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Original →
              </a>
            </div>
          </div>
        </div>

        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-grow mx-auto w-full max-w-3xl px-4 py-20"
        >
          {/* Content */}
          <motion.article 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="prose prose-lg mx-auto w-full border-4 border-black bg-white p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* Category and Tags if available */}
            <AnimatePresence>
              {(bookmark.category || (bookmark.tags && bookmark.tags.length > 0)) && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 flex flex-wrap gap-2"
                >
                  {bookmark.category && (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-block rounded-full border-2 border-black bg-gray-100 px-3 py-1 text-sm font-medium"
                    >
                      {bookmark.category}
                    </motion.span>
                  )}
                  {bookmark.tags?.map((tag: string) => (
                    <motion.div
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={`/tags/${tag}`}
                        className="inline-block rounded-full border-2 border-black bg-gray-100 px-3 py-1 text-sm font-medium hover:bg-cyan-100"
                      >
                        {tag}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <style dangerouslySetInnerHTML={{ __html: `
              .article-content {
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.6;
                color: #1a1a1a;
              }
              .article-content h1, 
              .article-content h2, 
              .article-content h3, 
              .article-content h4 {
                font-weight: 700;
                margin: 1.5em 0 0.5em;
                line-height: 1.3;
              }
              .article-content h1 { font-size: 1.75rem; }
              .article-content h2 { font-size: 1.5rem; }
              .article-content h3 { font-size: 1.25rem; }
              .article-content p { margin: 1em 0; }
              .article-content img { 
                max-width: 100%;
                height: auto;
                margin: 1em 0;
                border: 2px solid #e2e8f0;
              }
              .article-content pre {
                background: #f5f5f5;
                padding: 1em;
                overflow-x: auto;
                border-radius: 4px;
                margin: 1em 0;
                border: 2px solid #e2e8f0;
              }
              .article-content code {
                background: #f5f5f5;
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-size: 0.9em;
              }
              .article-content blockquote {
                border-left: 4px solid #e2e8f0;
                padding-left: 1em;
                margin: 1em 0;
                color: #4a5568;
                font-style: italic;
              }
              .article-content ul, 
              .article-content ol {
                margin: 1em 0;
                padding-left: 2em;
              }
              .article-content li { margin: 0.5em 0; }
              .article-content a {
                color: #2563eb;
                text-decoration: none;
                border-bottom: 1px dashed #2563eb;
              }
              .article-content a:hover {
                border-bottom: 1px solid #2563eb;
              }
              .error-message {
                color: #e53e3e;
                padding: 1em;
                border: 2px solid #e53e3e;
                border-radius: 4px;
                margin: 1em 0;
              }
              .error-message a {
                color: #2563eb;
                font-weight: 600;
              }
              .article-header {
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e2e8f0;
              }
              .article-title {
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
              }
              .article-source {
                margin-top: 1rem;
              }
              .article-source-link {
                display: inline-block;
                color: #2563eb;
                font-weight: 600;
                text-decoration: none;
              }
              /* Responsive adjustments */
              @media (max-width: 640px) {
                .article-content h1 { font-size: 1.5rem; }
                .article-content h2 { font-size: 1.3rem; }
                .article-content h3 { font-size: 1.15rem; }
                .article-content pre { padding: 0.75em; }
              }
              .iframe-container {
                width: 100%;
                height: 800px;
                border: 2px solid #e2e8f0;
                position: relative;
                overflow: hidden;
                margin: 1em 0;
                background: #f8fafc;
              }
              .iframe-container iframe {
                width: 100%;
                height: 100%;
                border: 0;
              }
              .iframe-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                padding: 0.5rem;
                background: rgba(0,0,0,0.7);
                color: white;
                font-size: 0.8rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .iframe-overlay button {
                background: #22d3ee;
                color: black;
                border: 2px solid black;
                padding: 2px 6px;
                font-weight: bold;
                cursor: pointer;
              }
              .iframe-fullheight {
                height: 90vh;
              }
              @media (max-width: 640px) {
                .iframe-container {
                  height: 600px;
                }
              }
            ` }} />
            
            {/* Content loading error - Show iframe or fallback */}
            {contentError ? (
              <div className="my-4">
                <div className="bg-yellow-100 border-4 border-black p-4 mb-4">
                  <h3 className="text-xl font-bold mb-2">Original Page</h3>
                  {iframeError ? (
                    <div className="space-y-4">
                      <p className="text-red-600 font-bold">This page cannot be embedded due to security restrictions.</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-lime-400 border-4 border-black px-4 py-3 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        >
                          Open in New Tab →
                        </a>
                        <button
                          onClick={() => setIframeError(false)}
                          className="flex-1 bg-cyan-400 border-4 border-black px-4 py-3 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        >
                          Try Loading Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>The original page is displayed below.</p>
                  )}
                </div>
                
                {!iframeError && (
                  <div className="iframe-container">
                    <div className="iframe-overlay">
                      <span>Viewing: {bookmark.url}</span>
                      <a 
                        href={bookmark.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-lime-400 border-2 border-black px-2 py-0.5 text-black text-xs font-bold"
                      >
                        Open in new tab
                      </a>
                    </div>
                    <iframe 
                      src={bookmark.url} 
                      title={bookmark.title}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      onLoad={(e) => {
                        try {
                          const frame = e.target as HTMLIFrameElement;
                          // Accessing contentWindow might throw a cross-origin error
                          if (!frame.contentWindow) {
                            throw new Error('Cannot access iframe content window');
                          }
                          // The try block itself acts as the check. If accessing contentWindow
                          // or its properties fails due to cross-origin restrictions,
                          // the catch block will be executed.
                          // No need for: frame.contentWindow.document; 
                        } catch { // Error variable is not needed here
                          setIframeError(true);
                        }
                      }}
                    />
                  </div>
                )}
                
                {!iframeError && (
                  <div className="flex justify-center my-4">
                    <button
                      onClick={() => {
                        const iframe = document.querySelector('.iframe-container') as HTMLElement;
                        if (iframe) {
                          iframe.classList.toggle('iframe-fullheight');
                        }
                      }}
                      className="bg-cyan-400 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                      Toggle Height
                    </button>
                  </div>
                )}
              </div>
            ) : bookmark.content ? (
              <div 
                dangerouslySetInnerHTML={{ __html: bookmark.content }}
                className="article-content"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingAnimation size="lg" text="Loading content..." />
                <div className="mt-6">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-purple-200 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    View Original →
                  </a>
                </div>
              </div>
            )}
          </motion.article>
          
          {/* Back to home button */}
          <motion.div 
            initial={{ opacity: 0, y:20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 mb-16 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/"
                className="bg-pink-200 border-4 border-black px-6 py-2 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none inline-flex items-center"
              >
                <span className="mr-1">←</span> Back to bookmarks
              </Link>
            </motion.div>
          </motion.div>
        </motion.main>
      </div>
    </PageTransition>
  );
}