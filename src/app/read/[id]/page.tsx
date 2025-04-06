'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import type { IBookmark, IHighlight } from '@/lib/db/models/bookmark';

export default function ReaderPage() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [selectedColor, setSelectedColor] = useState('#ffeb3b');
  const [isReapplyingHighlights, setIsReapplyingHighlights] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'none' | 'default'>('none');
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  // Available highlight colors
  const highlightColors = [
    '#ffeb3b', // yellow
    '#a5d6a7', // green
    '#90caf9', // blue
    '#f48fb1', // pink
    '#ce93d8'  // purple
  ];

  // Add cursor styles when a color is selected
  useEffect(() => {
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      (articleContent as HTMLElement).style.cursor = 'text';
    }
  }, []);

  // Update cursor style when color is selected
  useEffect(() => {
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      (articleContent as HTMLElement).style.cursor = selectedColor 
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E") 0 24, auto`
        : 'text';
    }
  }, [selectedColor]);

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

    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const getViewportHeight = () => {
      return window.visualViewport?.height || window.innerHeight;
    };

    const calculateProgress = () => {
      if (!isUserScrolling) return; // Don't calculate if not user-initiated

      const viewportHeight = getViewportHeight();
      const contentHeight = articleContent.scrollHeight;
      const scrollPosition = window.scrollY;
      const maxScroll = contentHeight - viewportHeight;

      // Calculate progress based on content height and scroll position
      const scrollPercentage = Math.min(
        100,
        Math.max(0, Math.round((scrollPosition / maxScroll) * 100))
      );
      
      // Only update if changed by at least 1%
      if (Math.abs(scrollPercentage - progress) >= 1) {
        setProgress(scrollPercentage);
        debouncedProgressUpdate(scrollPercentage);
      }
    };

    // Handle scroll events with throttling
    const handleScroll = () => {
      isUserScrolling = true;
      clearTimeout(scrollTimeout);
      
      // Reset the flag after scrolling stops
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 150);

      requestAnimationFrame(calculateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Handle resize events
    const handleResize = () => {
      requestAnimationFrame(calculateProgress);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      clearTimeout(scrollTimeout);
    };
  }, [bookmark?.content, progress, debouncedProgressUpdate]);

  // Restore scroll position when content loads
  useEffect(() => {
    if (!bookmark?.content) return;

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    // Wait for content to be fully rendered
    requestAnimationFrame(() => {
      // Get the total scrollable height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - viewportHeight;
      
      // Calculate scroll position based on saved progress
      const scrollPosition = ((bookmark.progress ?? 0) / 100) * documentHeight;
      window.scrollTo({
        top: scrollPosition,
        behavior: 'instant' // Use instant to prevent jarring animation on load
      });
    });
  }, [bookmark?.content, bookmark?.progress]);

  // Load highlights when bookmark data is available
  useEffect(() => {
    if (bookmark?.highlights) {
      setHighlights(bookmark.highlights);
    }
  }, [bookmark?.highlights]);

  // Handle text selection for highlighting
  const handleSelection = useCallback(async () => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selectedColor || selectionMode !== 'default') return;

      // Get selection coordinates
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Show toolbar at selection
      setToolbarPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top - 40
      });
      setIsToolbarVisible(true);

    } catch (error) {
      console.error('Error in handleSelection:', error);
    }
  }, [selectedColor, selectionMode]);

  // Function to reapply highlights
  const reapplyHighlights = useCallback(() => {
    const articleContent = document.querySelector('.article-content');
    if (!articleContent || !highlights.length || isReapplyingHighlights) return;

    setIsReapplyingHighlights(true);

    // Reset any existing highlights
    const existingHighlights = articleContent.getElementsByClassName('highlight');
    Array.from(existingHighlights).forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      }
    });

    // Sort highlights by start offset (descending) to avoid position shifts
    const sortedHighlights = [...highlights].sort((a, b) => b.startOffset - a.startOffset);

    // Apply new highlights using the existing applyHighlight function
    const applyHighlight = (highlight: IHighlight) => {
      const walker = document.createTreeWalker(
        articleContent,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.parentElement?.classList.contains('highlight')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentOffset = 0;
      let startNode: Text | null = null;
      let startNodeOffset = 0;
      let endNode: Text | null = null;
      let endNodeOffset = 0;
      let node: Text | null = walker.nextNode() as Text;

      while (node) {
        const nodeLength = node.textContent?.length || 0;
        const nextOffset = currentOffset + nodeLength;

        if (!startNode && currentOffset <= highlight.startOffset && highlight.startOffset < nextOffset) {
          startNode = node;
          startNodeOffset = highlight.startOffset - currentOffset;
        }

        if (!endNode && currentOffset <= highlight.endOffset && highlight.endOffset <= nextOffset) {
          endNode = node;
          endNodeOffset = highlight.endOffset - currentOffset;
          break;
        }

        currentOffset = nextOffset;
        node = walker.nextNode() as Text;
      }

      if (startNode && endNode) {
        try {
          const range = document.createRange();
          range.setStart(startNode, startNodeOffset);
          range.setEnd(endNode, endNodeOffset);

          const span = document.createElement('span');
          span.className = 'highlight';
          span.style.backgroundColor = highlight.color;
          span.style.borderRadius = '2px';
          span.style.padding = '0 2px';
          span.style.margin = '0 -2px';
          span.style.cursor = 'pointer';
          span.dataset.startOffset = highlight.startOffset.toString();
          span.dataset.endOffset = highlight.endOffset.toString();
          span.dataset.highlightId = `${highlight.startOffset}-${highlight.endOffset}`;

          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        } catch (error) {
          console.error('Error applying highlight:', error);
        }
      }
    };

    sortedHighlights.forEach(applyHighlight);
    setIsReapplyingHighlights(false);
  }, [highlights, isReapplyingHighlights]);

  // Reapply highlights on scroll end and window focus
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        reapplyHighlights();
      }, 100); // Debounce scroll events
    };

    const handleFocus = () => {
      reapplyHighlights();
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(scrollTimeout);
    };
  }, [reapplyHighlights]);

  // Initial highlight application
  useEffect(() => {
    reapplyHighlights();
  }, [reapplyHighlights]);

  // Apply highlights to the content
  useEffect(() => {
    const articleContent = document.querySelector('.article-content');
    if (!articleContent || !highlights.length) return;

    // Reset any existing highlights
    const existingHighlights = articleContent.getElementsByClassName('highlight');
    Array.from(existingHighlights).forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      }
    });

    // Sort highlights by start offset (descending) to avoid position shifts
    const sortedHighlights = [...highlights].sort((a, b) => b.startOffset - a.startOffset);

    // Apply new highlights
    const applyHighlight = (highlight: IHighlight) => {
      const walker = document.createTreeWalker(
        articleContent,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip text nodes that are already within highlights
            if (node.parentElement?.classList.contains('highlight')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentOffset = 0;
      let startNode: Text | null = null;
      let startNodeOffset = 0;
      let endNode: Text | null = null;
      let endNodeOffset = 0;
      let node: Text | null = walker.nextNode() as Text;

      while (node) {
        const nodeLength = node.textContent?.length || 0;
        const nextOffset = currentOffset + nodeLength;

        if (!startNode && currentOffset <= highlight.startOffset && highlight.startOffset < nextOffset) {
          startNode = node;
          startNodeOffset = highlight.startOffset - currentOffset;
        }

        if (!endNode && currentOffset <= highlight.endOffset && highlight.endOffset <= nextOffset) {
          endNode = node;
          endNodeOffset = highlight.endOffset - currentOffset;
          break;
        }

        currentOffset = nextOffset;
        node = walker.nextNode() as Text;
      }

      if (startNode && endNode) {
        try {
          const range = document.createRange();
          range.setStart(startNode, startNodeOffset);
          range.setEnd(endNode, endNodeOffset);

          const span = document.createElement('span');
          span.className = 'highlight';
          span.style.backgroundColor = highlight.color;
          span.style.borderRadius = '2px';
          span.style.padding = '0 2px';
          span.style.margin = '0 -2px';
          span.style.cursor = 'pointer';
          span.style.position = 'relative';
          
          span.dataset.startOffset = highlight.startOffset.toString();
          span.dataset.endOffset = highlight.endOffset.toString();
          span.dataset.highlightId = `${highlight.startOffset}-${highlight.endOffset}`;

          // Handle the case where highlights might overlap or be adjacent
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        } catch (error) {
          console.error('Error applying highlight:', error);
        }
      }
    };

    sortedHighlights.forEach(applyHighlight);

    // Add click handler for highlights
    const handleHighlightClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('highlight')) return;

      // Don't remove highlight if there's a text selection
      if (window.getSelection()?.isCollapsed === false) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Only proceed with removal if explicitly intended (e.g. double tap or long press)
      if (confirm('Remove this highlight?')) {
        const startOffset = parseInt(target.dataset.startOffset || '0', 10);
        const endOffset = parseInt(target.dataset.endOffset || '0', 10);
        
        (async () => {
          try {
            const response = await fetch('/api/bookmarks', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id,
                highlightOperation: 'remove',
                highlight: { startOffset, endOffset }
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to remove highlight');
            }

            setHighlights(prev => 
              prev.filter(h => h.startOffset !== startOffset || h.endOffset !== endOffset)
            );

            target.outerHTML = target.innerHTML;
          } catch (error) {
            console.error('Error removing highlight:', error);
            alert('Failed to remove highlight');
          }
        })();
      }
    };

    articleContent.addEventListener('click', handleHighlightClick as EventListener);
    return () => {
      articleContent.removeEventListener('click', handleHighlightClick as EventListener);
    };
  }, [highlights, id]);

  // Add highlight color picker and event listeners
  useEffect(() => {
    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    const handleMouseUp = () => {
      if (selectionMode === 'default') {
        handleSelection();
      }
    };

    articleContent.addEventListener('mouseup', handleMouseUp as EventListener);
    return () => {
      articleContent.removeEventListener('mouseup', handleMouseUp as EventListener);
    };
  }, [handleSelection, selectionMode]);

  // Handle actual highlight creation
  const createHighlight = useCallback(async () => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selectedColor) return;

      const range = selection.getRangeAt(0).cloneRange();
      const articleContent = document.querySelector('.article-content');
      if (!articleContent || !articleContent.contains(range.commonAncestorContainer)) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        throw new Error('Empty selection');
      }

      // Calculate offsets relative to article content
      const preSelectionRange = document.createRange();
      try {
        preSelectionRange.selectNodeContents(articleContent);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preSelectionRange.toString().length;
        const endOffset = startOffset + selectedText.length;

        // Validate offsets
        if (startOffset === endOffset || startOffset < 0 || endOffset < 0) {
          throw new Error('Invalid selection range');
        }

        // Create highlight span for visual feedback first
        const span = document.createElement('span');
        span.className = 'highlight';
        span.style.backgroundColor = selectedColor;
        span.style.borderRadius = '2px';
        span.style.padding = '0 2px';
        span.style.margin = '0 -2px';
        span.style.cursor = 'pointer';
        span.dataset.startOffset = startOffset.toString();
        span.dataset.endOffset = endOffset.toString();
        span.title = 'Click to remove highlight';

        // Create the highlight object
        const newHighlight = {
          text: selectedText,
          startOffset: Number(startOffset),
          endOffset: Number(endOffset),
          color: selectedColor,
          createdAt: new Date()
        };

        // Clear the selection before modifying the DOM
        selection.removeAllRanges();

        try {
          range.surroundContents(span);
        } catch (surroundError) {
          console.error('Error surrounding contents:', surroundError);
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }

        // Save highlight to database
        const response = await fetch('/api/bookmarks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            highlightOperation: 'add',
            highlight: newHighlight
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server response:', response.status, errorData);
          
          // Remove the highlight span since save failed
          if (span.parentNode) {
            span.outerHTML = span.innerHTML;
          }
          throw new Error(errorData.message || 'Failed to save highlight');
        }

        // Update local state
        setHighlights(prev => [...prev, newHighlight]);
        setIsToolbarVisible(false);

      } finally {
        // Clean up
        preSelectionRange.detach();
        range.detach();
      }

    } catch (error) {
      console.error('Error in createHighlight:', error);
      // Clean up any partial highlights
      const articleContent = document.querySelector('.article-content');
      if (articleContent) {
        const partialHighlights = articleContent.querySelectorAll('.highlight:not([data-highlight-id])');
        partialHighlights.forEach(el => {
          if (el.parentNode) {
            el.outerHTML = el.innerHTML;
          }
        });
      }
      alert(error instanceof Error ? error.message : 'Failed to save highlight');
    }
  }, [selectedColor, id]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
          <LoadingAnimation size="lg" text="Loading article..." />
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
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Mobile-optimized header */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* First row with back button and title */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <Link
                    href="/"
                    className="flex-shrink-0 bg-pink-200 border-4 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    ←
                  </Link>
                  <h1 className="font-bold text-base sm:text-lg truncate">{bookmark.title}</h1>
                </div>
                
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 bg-purple-200 border-4 border-black px-3 py-1 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ml-2"
                >
                  Original →
                </a>
              </div>

              {/* Progress and highlight controls row */}
              <div className="flex flex-wrap items-center gap-3 pb-1 sm:pb-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-400"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{progress}%</span>
                </div>

                {/* Highlight controls - optimized for mobile and desktop */}
                <div className="flex flex-1 items-center gap-2 border-4 border-black p-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto highlight-controls">
                  <div className="flex items-center gap-1">
                    {highlightColors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                          selectedColor === color ? 'border-black' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`Select ${color} highlight color`}
                      />
                    ))}
                  </div>

                  <div className="w-px h-6 bg-black mx-2" />

                  {/* Highlights Navigation - Desktop optimized */}
                  <div className="hidden sm:block flex-1 min-w-[200px]">
                    <select
                      className="w-full border-2 border-black px-2 py-1 text-sm font-medium bg-white appearance-none bg-[length:1em_1em] bg-[right_0.5rem_center] bg-no-repeat"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")`
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) return;
                        
                        const highlightElement = document.querySelector(
                          `[data-highlight-id="${value}"]`
                        );
                        if (highlightElement) {
                          highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          highlightElement.classList.add('highlight-flash');
                          setTimeout(() => highlightElement.classList.remove('highlight-flash'), 1000);
                        }
                        e.target.value = '';
                      }}
                      value=""
                    >
                      <option value="">Jump to highlight...</option>
                      {highlights.map((highlight) => (
                        <option 
                          key={`${highlight.startOffset}-${highlight.endOffset}`}
                          value={`${highlight.startOffset}-${highlight.endOffset}`}
                          className="py-1"
                        >
                          {(highlight.text.substring(0, 30) + (highlight.text.length > 30 ? '...' : ''))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1">
          {/* Main content */}
          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-grow w-full px-4 sm:px-4 pt-52 sm:pt-56 pb-20 lg:pr-[320px]"
          >
            <motion.article 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="max-w-3xl mx-auto w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div 
                className="prose prose-lg w-full max-w-none sm:p-6 md:p-8 article-content"
                dangerouslySetInnerHTML={{ __html: bookmark.content || '' }}
              />
            </motion.article>
          </motion.main>

          {/* Highlights Sidebar - Ensure it doesn't overlap */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="highlights-sidebar fixed lg:sticky top-0 right-0 w-[280px] lg:w-80 h-screen bg-white border-l-4 border-black overflow-y-auto pt-[120px] lg:pt-36 transform translate-x-full lg:translate-x-0 transition-transform duration-300 z-40 lg:z-auto"
          >
            <div className="p-4">
              <div className="lg:hidden flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                <h2 className="text-xl font-bold">Highlights</h2>
                <button
                  onClick={(e) => {
                    const sidebar = (e.target as HTMLElement).closest('.highlights-sidebar');
                    sidebar?.classList.add('translate-x-full');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close highlights sidebar"
                >
                  ✕
                </button>
              </div>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold mb-4 border-b-4 border-black pb-2">Highlights</h2>
              </div>
              {highlights.length === 0 ? (
                <p className="text-gray-500 italic">No highlights yet. Select text to highlight it.</p>
              ) : (
                <div className="space-y-4">
                  {highlights.sort((a, b) => a.startOffset - b.startOffset).map((highlight) => (
                    <div
                      key={`${highlight.startOffset}-${highlight.endOffset}`}
                      className="group relative border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                      style={{ backgroundColor: highlight.color + '40' }}
                      onClick={() => {
                        const highlightElement = document.querySelector(
                          `[data-highlight-id="${highlight.startOffset}-${highlight.endOffset}"]`
                        );
                        if (highlightElement) {
                          highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          highlightElement.classList.add('highlight-flash');
                          setTimeout(() => highlightElement.classList.remove('highlight-flash'), 1000);
                        }
                      }}
                    >
                      <p className="text-sm font-medium line-clamp-3 pr-8">{highlight.text}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(highlight.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Remove this highlight?')) {
                            (async () => {
                              try {
                                const response = await fetch('/api/bookmarks', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id,
                                    highlightOperation: 'remove',
                                    highlight: {
                                      startOffset: highlight.startOffset,
                                      endOffset: highlight.endOffset
                                    }
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to remove highlight');
                                }

                                setHighlights(prev => 
                                  prev.filter(h => 
                                    h.startOffset !== highlight.startOffset || 
                                    h.endOffset !== highlight.endOffset
                                  )
                                );

                                const highlightElement = document.querySelector(
                                  `[data-highlight-id="${highlight.startOffset}-${highlight.endOffset}"]`
                                );
                                if (highlightElement) {
                                  highlightElement.outerHTML = highlightElement.innerHTML;
                                }
                              } catch (error) {
                                console.error('Error removing highlight:', error);
                                alert('Failed to remove highlight');
                              }
                            })();
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 border-2 border-black p-1 rounded-full transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Remove highlight"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </div>

        {/* Mobile highlight toggle button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const sidebar = document.querySelector('.highlights-sidebar');
              sidebar?.classList.toggle('translate-x-full');
            }}
            className="bg-cyan-400 border-4 border-black w-14 h-14 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
            aria-label="Toggle highlights"
          >
            <span className="text-2xl">✨</span>
          </motion.button>
        </div>

        {/* Selection Mode Toggle */}
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectionMode('none')}
            className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center ${
              selectionMode === 'none' ? 'bg-yellow-200' : 'bg-white'
            }`}
            aria-label="Disable all selection modes"
          >
            <span className="text-xl">❌</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectionMode(selectionMode === 'default' ? 'none' : 'default')}
            className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center ${
              selectionMode === 'default' ? 'bg-yellow-200' : 'bg-white'
            }`}
            aria-label="Selection toolbar mode"
          >
            <span className="text-xl">✂️</span>
          </motion.button>
        </div>

        {/* Selection Toolbar */}
        {isToolbarVisible && selectionMode === 'default' && (
          <div 
            className="text-selection-toolbar visible"
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`
            }}
          >
            <button onClick={createHighlight}>
              Highlight
            </button>
          </div>
        )}

        <style jsx global>{`
          /* Base article content styling */
          .article-content {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 1rem;
          }

          /* Typography */
          .article-content h1, 
          .article-content h2, 
          .article-content h3, 
          .article-content h4 {
            font-weight: 700;
            margin: 1.5em 0 0.5em;
            line-height: 1.3;
            padding: 0 1rem;
          }
          .article-content h1 { font-size: 1.75rem; }
          .article-content h2 { font-size: 1.5rem; }
          .article-content h3 { font-size: 1.25rem; }
          
          /* Paragraphs and lists */
          .article-content p,
          .article-content ul,
          .article-content ol { 
            margin: 1em 0;
            padding: 0 1rem;
          }
          .article-content li { 
            margin: 0.5em 0;
            padding: 0 1rem;
          }

          /* Images */
          .article-content img { 
            display: block;
            max-width: calc(100% + 2rem);
            margin: 1.5em -1rem;
            height: auto;
            border: none;
          }

          /* Code blocks */
          .article-content pre {
            background: #f5f5f5;
            padding: 1rem;
            overflow-x: auto;
            margin: 1.5em -1rem;
            border: none;
            width: calc(100% + 2rem);
          }
          .article-content code {
            background: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
          }

          /* Blockquotes */
          .article-content blockquote {
            border-left: 4px solid #e2e8f0;
            padding: 0.5em 1rem;
            margin: 1.5em 0;
            color: #4a5568;
            font-style: italic;
            background: #f8fafc;
          }

          /* Links */
          .article-content a {
            color: #2563eb;
            text-decoration: none;
            border-bottom: 1px dashed #2563eb;
          }
          .article-content a:hover {
            border-bottom: 1px solid #2563eb;
          }

          /* iframe container styles */
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

          /* Error message styles */
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

          /* Article header styles */
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

          /* Highlight effects */
          .highlight-flash {
            animation: flash 1s ease-out;
          }

          @keyframes flash {
            0% { background-color: rgba(255, 235, 59, 0.6); }
            100% { background-color: transparent; }
          }

          /* Desktop styles */
          @media (min-width: 640px) {
            .article-content {
              padding: 2rem;
            }
            
            .article-content h1,
            .article-content h2,
            .article-content h3,
            .article-content h4,
            .article-content p,
            .article-content ul,
            .article-content ol,
            .article-content li {
              padding: 0;
            }

            .article-content img {
              max-width: 100%;
              margin: 1.5em auto;
              border: 2px solid #e2e8f0;
              border-radius: 4px;
            }

            .article-content pre {
              margin: 1.5em 0;
              width: 100%;
              border: 2px solid #e2e8f0;
              border-radius: 4px;
            }

            .highlight-controls {
              padding: 0.75rem;
            }
          }

          /* Mobile optimizations */
          @media (max-width: 640px) {
            .article-content {
              padding: 1rem;
            }
            .article-content h1 { font-size: 1.5rem; }
            .article-content h2 { font-size: 1.3rem; }
            .article-content h3 { font-size: 1.15rem; }
            .article-content pre { padding: 0.75em; }
            .highlight-controls { padding: 0.5rem; }
            .iframe-container { height: 400px; }

            /* Adjust touch targets for better mobile highlighting */
            .highlight {
              padding: 0 4px !important;
              margin: 0 -4px !important;
              border-radius: 4px !important;
            }
          }

          /* Selection toolbar styles */
          .text-selection-toolbar {
            position: fixed;
            background-color: white;
            border: 2px solid black;
            border-radius: 4px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
            padding: 4px;
            gap: 4px;
          }
          .text-selection-toolbar.visible {
            display: flex;
          }
          .text-selection-toolbar button {
            background-color: #ffeb3b;
            border: 2px solid black;
            border-radius: 4px;
            padding: 4px 8px;
            font-weight: bold;
            cursor: pointer;
          }
        `}</style>

        {/* Add mobile-specific styles */}
        <style jsx global>{`
          /* Improve text selection behavior */
          @media (max-width: 640px) {
            .article-content {
              -webkit-user-select: text !important;
              user-select: text !important;
              -webkit-touch-callout: default !important;
              touch-action: manipulation !important;
            }

            .article-content * {
              -webkit-user-select: text !important;
              user-select: text !important;
              -webkit-touch-callout: default !important;
            }

            /* Make highlights easier to tap */
            .highlight {
              padding: 4px 8px !important;
              margin: -4px -8px !important;
              border-radius: 4px !important;
              min-height: 2em;
              display: inline-block;
            }

            /* Prevent text selection from being too sensitive */
            .article-content {
              touch-action: pan-x pan-y pinch-zoom !important;
            }
          }
        `}</style>

        {/* Add touch event handlers for mobile */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const articleContent = document.querySelector('.article-content');
            if (!articleContent) return;

            let touchStartTime;
            let touchEndTimer;
            let lastTapTime = 0;
            const doubleTapDelay = 300;
            let isSelecting = false;

            // Helper function to get the current highlight color
            const getCurrentHighlightColor = () => {
              const activeColorButton = document.querySelector('.highlight-controls button[class*="border-black"]');
              return activeColorButton ? activeColorButton.style.backgroundColor : '#ffeb3b';
            };

            // Handle touch start
            articleContent.addEventListener('touchstart', function(e) {
              touchStartTime = Date.now();
              isSelecting = false;
            }, { passive: false });

            // Handle selection changes
            document.addEventListener('selectionchange', function() {
              const selection = window.getSelection();
              if (selection && !selection.isCollapsed) {
                isSelecting = true;
                
                // Clear any existing timer
                if (touchEndTimer) {
                  clearTimeout(touchEndTimer);
                }
                
                // Set new timer for auto-highlighting
                touchEndTimer = setTimeout(() => {
                  const mouseEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  articleContent.dispatchEvent(mouseEvent);
                }, 1000); // Reduced to 1 second for better responsiveness
              }
            });

            // Handle touch end
            articleContent.addEventListener('touchend', function(e) {
              const touchDuration = Date.now() - touchStartTime;
              const currentTime = Date.now();
              
              // Handle double tap
              if (currentTime - lastTapTime < doubleTapDelay) {
                if (touchEndTimer) clearTimeout(touchEndTimer);
                isSelecting = false;
                return; // Let default behavior handle text selection
              }
              
              lastTapTime = currentTime;

              // If we're selecting text
              if (isSelecting) {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                  // Don't clear the selection
                  e.preventDefault();
                  return;
                }
              }

              // For long press, trigger highlighting
              if (touchDuration > 500) {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                  e.preventDefault();
                  
                  // Create and dispatch mouseup event to trigger highlighting
                  const mouseEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  articleContent.dispatchEvent(mouseEvent);
                }
              }
            });

            // Clean up selection timer when touch is cancelled
            articleContent.addEventListener('touchcancel', function() {
              if (touchEndTimer) {
                clearTimeout(touchEndTimer);
              }
              isSelecting = false;
            });

            // Prevent the context menu on long press
            articleContent.addEventListener('contextmenu', function(e) {
              e.preventDefault();
            });

            // Prevent default touch behavior that might interfere with selection
            articleContent.addEventListener('touchmove', function(e) {
              if (isSelecting) {
                e.stopPropagation();
              }
            }, { passive: true });
          });
        `}} />
      </div>
    </PageTransition>
  );
}