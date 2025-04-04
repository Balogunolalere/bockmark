'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Bookmark {
  _id: string;
  url: string;
  title: string;
  content?: string;
  progress?: number;
}

export default function ReaderPage() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const fetchBookmark = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch bookmark');
      }
      const data = await response.json();
      setBookmark(data);
      setProgress(data.progress || 0);
    } catch (error) {
      console.error('Error fetching bookmark:', error);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookmark) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="mb-4 text-2xl font-bold">Bookmark not found</h1>
            <Link
              href="/"
              className="inline-block bg-lime-400 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 z-50 h-2 w-full bg-gray-200">
        <div
          className="h-full bg-cyan-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b-4 border-black bg-pink-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-4 overflow-hidden">
            <Link
              href="/"
              className="flex-shrink-0 bg-white border-4 border-black p-2 text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              ←
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold line-clamp-1">{bookmark.title}</h1>
          </div>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-purple-200 border-4 border-black px-4 py-2 text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Original →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Controls */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-lg border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-base sm:text-lg font-bold">Reading Progress: {progress}%</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateProgress(Math.max(0, progress - 10))}
              className="flex-1 sm:flex-none bg-yellow-200 border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              -10%
            </button>
            <button
              onClick={() => updateProgress(Math.min(100, progress + 10))}
              className="flex-1 sm:flex-none bg-lime-400 border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              +10%
            </button>
            <button
              onClick={() => updateProgress(100)}
              className="flex-1 sm:flex-none bg-cyan-400 border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Mark as Read
            </button>
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-lg mx-auto max-w-none border-4 border-black bg-white p-4 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
            .article-content h1 { font-size: 1.875rem; }
            .article-content h2 { font-size: 1.5rem; }
            .article-content h3 { font-size: 1.25rem; }
            .article-content p { margin: 1em 0; }
            .article-content img { 
              max-width: 100%;
              height: auto;
              margin: 1em 0;
            }
            .article-content pre {
              background: #f5f5f5;
              padding: 1em;
              overflow-x: auto;
              border-radius: 4px;
              margin: 1em 0;
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
            }
            .article-content a:hover {
              text-decoration: underline;
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
          ` }} />
          {bookmark.content ? (
            <div 
              dangerouslySetInnerHTML={{ __html: bookmark.content }}
              className="article-content"
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-600">No readable content found.</p>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-lime-400 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                View Original
              </a>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}