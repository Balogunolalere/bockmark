'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  content?: string;
  progress?: number;
  category?: string;
  tags?: string[];
}

export default function ReaderPage() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{message: string; code?: string} | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const fetchBookmark = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookmark');
      }
      
      const data = await response.json();
      setBookmark(data);
      setProgress(data.progress || 0);
    } catch (error) {
      console.error('Error fetching bookmark:', error);
      setFetchError({
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'FETCH_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchBookmark();
    }
  }, [status, id, fetchBookmark, router]);

  const updateProgress = async (newProgress: number) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          progress: newProgress,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to update progress');
      }

      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Calculate reading time and scroll position
  useEffect(() => {
    if (!bookmark?.content) return;

    // Track scroll position to update progress
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Calculate scroll percentage and update progress if significantly changed
      if (docHeight > windowHeight) {
        const scrollPercentage = Math.min(
          100,
          Math.round((scrollPosition / (docHeight - windowHeight)) * 100)
        );
        
        // Only update if changed by at least 5%
        if (Math.abs(scrollPercentage - progress) >= 5) {
          updateProgress(scrollPercentage);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bookmark, progress, updateProgress]);

  // Parse the error message from the content if it contains one
  const parseContentError = useCallback(() => {
    if (!bookmark?.content) return null;
    
    // Check if the content is actually an error message
    if (bookmark.content.includes('Error Fetching Content') || 
        bookmark.content.includes('Could not retrieve or parse')) {
      
      // Try to extract the error code
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="mx-auto max-w-3xl w-full">
          <div className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <LoadingAnimation size="lg" text="Loading article..." />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="mx-auto max-w-3xl w-full">
          <ErrorDisplay 
            title="Failed to Load Bookmark"
            message={fetchError.message}
            errorCode={fetchError.code}
            showHomeButton={true}
          />
        </div>
      </div>
    );
  }

  if (!bookmark) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="mx-auto max-w-3xl w-full">
          <ErrorDisplay 
            title="Bookmark Not Found"
            message="We couldn't find the bookmark you're looking for."
            showHomeButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 z-50 h-2 w-full bg-gray-200">
        <div
          className="h-full bg-cyan-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-2 z-40 mx-4 sm:mx-auto max-w-3xl">
        <div className="flex items-center justify-between rounded-lg border-4 border-black bg-pink-200 px-3 sm:px-6 py-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link
              href="/"
              className="flex-shrink-0 bg-white border-4 border-black p-2 text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              ←
            </Link>
            <h1 className="text-base sm:text-xl font-bold line-clamp-1">{bookmark.title}</h1>
          </div>
          <div className="hidden sm:block">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-purple-200 border-4 border-black px-3 py-1 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Original →
            </a>
          </div>
        </div>
      </header>

      {/* Progress Display (Desktop) */}
      <div className="sticky top-[calc(0.5rem+4rem)] z-30 hidden lg:flex items-center justify-end mb-6 gap-2 max-w-3xl mx-auto w-full px-4">
        <div className="flex items-center rounded-full border-4 border-black bg-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-sm font-bold mr-2">Progress: {progress}%</span>
          <button
            onClick={() => updateProgress(Math.max(0, progress - 10))}
            className="bg-yellow-200 border-2 border-black px-2 py-0.5 text-xs font-bold rounded-l-sm hover:bg-yellow-300"
          >
            -10%
          </button>
          <button
            onClick={() => updateProgress(Math.min(100, progress + 10))}
            className="bg-lime-400 border-2 border-black px-2 py-0.5 text-xs font-bold hover:bg-lime-500"
          >
            +10%
          </button>
          <button
            onClick={() => updateProgress(100)}
            className="bg-cyan-400 border-2 border-black px-2 py-0.5 text-xs font-bold rounded-r-sm hover:bg-cyan-500 ml-1"
          >
            Done
          </button>
        </div>
      </div>

      <main className="flex-grow mx-auto w-full max-w-3xl px-4 py-6">
        {/* Content */}
        <article className="prose prose-lg mx-auto w-full border-4 border-black bg-white p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Category and Tags if available */}
          {(bookmark.category || (bookmark.tags && bookmark.tags.length > 0)) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {bookmark.category && (
                <span className="inline-block rounded-full border-2 border-black bg-gray-100 px-3 py-1 text-sm font-medium">
                  {bookmark.category}
                </span>
              )}
              {bookmark.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="inline-block rounded-full border-2 border-black bg-gray-100 px-3 py-1 text-sm font-medium hover:bg-cyan-100"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
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
                        if (frame.contentWindow) {
                          frame.contentWindow.document;
                        }
                      } catch (error) {
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
        </article>
        
        {/* Back to home button */}
        <div className="mt-8 mb-16 text-center">
          <Link
            href="/"
            className="bg-pink-200 border-4 border-black px-6 py-2 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none inline-flex items-center"
          >
            <span className="mr-1">←</span> Back to bookmarks
          </Link>
        </div>
      </main>
    </div>
  );
}