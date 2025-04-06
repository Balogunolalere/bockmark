import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Bookmark } from '@/lib/db/models/bookmark';
import { authOptions } from '@/lib/auth.config';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';

// Array of user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1'
];

// Cache User-Agent for reuse
const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Cache headers for reuse
const commonHeaders = {
  'User-Agent': userAgent,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// Cache connection promise
let cachedConnection: Promise<typeof mongoose> | null = null;

async function getConnection() {
  if (!cachedConnection) {
    cachedConnection = connectToDatabase();
  }
  return cachedConnection;
}

async function extractReadableContent(html: string, url: string) {
  // Create a DOM from the HTML
  const dom = new JSDOM(html, {
    url,
    contentType: 'text/html',
    pretendToBeVisual: true
  });

  const document = dom.window.document;
  const title = document.title;

  // Strategy 1: Use Mozilla Readability
  try {
    const reader = new Readability(document, {
      debug: false,
      charThreshold: 20
    });
    const article = reader.parse();

    if (article && article.content && article.content.length > 100) {
      return formatContent(title, article.content, url);
    }
  } catch (error) {
    console.error('Readability parsing error:', error);
  }

  // Strategy 2: Look for main content containers
  const possibleContentSelectors = [
    'article', 
    'main', 
    '[role="main"]', 
    '.article', 
    '.post', 
    '.entry-content', 
    '.content', 
    '#content',
    '.article__body',
    '.post-content'
  ];

  for (const selector of possibleContentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim().length > 200) {
      return formatContent(title, element.innerHTML, url);
    }
  }

  // Strategy 3: Use largest text block
  const textBlocks = Array.from(document.querySelectorAll('div, section, article'))
    .filter(el => {
      // Filter out navigation, header, footer, etc.
      const tag = el.tagName.toLowerCase();
      const className = (el.className || '').toLowerCase();
      const id = (el.id || '').toLowerCase();

      const excluded = ['nav', 'header', 'footer', 'sidebar', 'menu', 'comment'].some(term => 
        tag.includes(term) || className.includes(term) || id.includes(term)
      );

      return !excluded;
    })
    .map(el => ({
      element: el,
      textLength: el.textContent?.length || 0,
      paragraphCount: el.querySelectorAll('p').length
    }))
    .filter(item => item.textLength > 200)
    .sort((a, b) => {
      // Prioritize elements with more paragraphs, then more text
      if (a.paragraphCount > b.paragraphCount * 1.5) return -1;
      if (b.paragraphCount > a.paragraphCount * 1.5) return 1;
      return b.textLength - a.textLength;
    });

  if (textBlocks.length > 0) {
    return formatContent(title, textBlocks[0].element.innerHTML, url);
  }

  // Strategy 4: Just get all paragraphs if nothing else works
  const paragraphs = Array.from(document.querySelectorAll('p'))
    .filter(p => {
      const text = p.textContent?.trim() || '';
      return text.length > 50 && text.split(' ').length > 10;
    });

  if (paragraphs.length > 0) {
    const content = '<div>' + paragraphs.map(p => p.outerHTML).join('') + '</div>';
    return formatContent(title, content, url);
  }

  throw new Error('No readable content found on this page');
}

function formatContent(title: string, content: string, url: string) {
  // Clean the content
  let cleanContent = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/style="[^"]*"/gi, '')
    .replace(/onclick="[^"]*"/gi, '')
    .replace(/onload="[^"]*"/gi, '')
    .replace(/onerror="[^"]*"/gi, '')
    .trim();

  // Convert relative URLs to absolute
  cleanContent = cleanContent.replace(/(?:href|src)=["'](?!http|#|mailto)([^"']+)["']/gi, (match, p1) => {
    try {
      const absoluteUrl = new URL(p1, url).href;
      return match.replace(p1, absoluteUrl);
    } catch {
      return match;
    }
  });

  return `
    <div class="article-content">
      <div class="article-header">
        <h1 class="article-title">${title || 'Untitled Article'}</h1>
        <div class="article-source">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="article-source-link">
            View original article →
          </a>
        </div>
      </div>
      <div class="article-body">
        ${cleanContent}
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await getConnection();

  try {
    const body = await req.json();
    // Validate required fields
    const { url, title: initialTitle, category, tags: tagsInput, color } = body;
    if (!url || !initialTitle || !category) {
      return NextResponse.json({ message: 'Missing required fields (url, title, category)' }, { status: 400 });
    }

    let content = '';
    const fetchedTitle = initialTitle; // Default to user-provided title

    try {
      // Fetch HTML content from the URL with a timeout and rotating user agent
      const response = await axios.get(url, { 
        timeout: 15000,
        headers: commonHeaders
      });

      // Extract and process the content
      const html = response.data;
      content = await extractReadableContent(html, url);

    } catch (error: unknown) {
      console.error(`Error fetching/parsing content for ${url}:`, error instanceof Error ? error.message : String(error));
      // Store an error message in the content field
      const errorMessage = error instanceof AxiosError ? error.code || error.message : 
                          error instanceof Error ? error.message : 
                          'Unknown error';
      content = `
        <div style="text-align: center; padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
          <h2>Error Fetching Content</h2>
          <p>Could not retrieve or parse the content from the URL.</p>
          <p>Reason: ${errorMessage}</p>
          <p><a href="${url}" target="_blank" rel="noopener noreferrer">View original page →</a></p>
        </div>
      `;
      // Keep the user-provided title if fetching failed
    }

    // Ensure tags are processed correctly into an array
    const tags = Array.isArray(tagsInput) ? tagsInput.map(tag => String(tag).trim()).filter(tag => tag !== '') :
                 typeof tagsInput === 'string' ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '') :
                 [];


    // Create and save the bookmark
    const bookmark = new Bookmark({
      url,
      title: fetchedTitle, // Use the determined title
      category,
      tags,
      color: color || undefined, // Use provided color or default
      content, // Save the extracted content or error message
      userId: session.user.id,
      progress: 0,
      isFavorite: false, // Default value
      createdAt: new Date(), // Set creation date
      updatedAt: new Date(), // Set updated date
    });

    await bookmark.save();

    return NextResponse.json(bookmark, { status: 201 });

  } catch (error: Error | unknown) {
    console.error('Bookmark creation error:', error);
    // Determine status code based on error type if possible
    const statusCode = error instanceof Error && error.name === 'ValidationError' ? 400 : 500;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error during bookmark creation' },
      { status: statusCode }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await getConnection();

    // Check if a specific bookmark ID is requested
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Set cache-control headers
    const headers = {
      'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300'
    };

    if (id) {
      const bookmark = await Bookmark.findOne({
        _id: id,
        userId: session.user.id
      }).lean(); // Use lean() for better performance

      if (!bookmark) {
        return NextResponse.json(
          { message: 'Bookmark not found' },
          { status: 404, headers }
        );
      }

      return NextResponse.json(bookmark, { headers });
    }

    // Get all bookmarks with pagination support
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const bookmarks = await Bookmark.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return NextResponse.json(bookmarks, { headers });
  } catch (error) {
    console.error('Bookmark fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    await getConnection();

    // Handle highlight operations
    if ('highlightOperation' in updateData) {
      const bookmark = await Bookmark.findOne({ _id: id, userId: session.user.id });
      if (!bookmark) {
        return NextResponse.json({ message: 'Bookmark not found' }, { status: 404 });
      }

      switch (updateData.highlightOperation) {
        case 'add':
          const { text, startOffset, endOffset, color } = updateData.highlight;
          bookmark.highlights = [...(bookmark.highlights || []), {
            text,
            startOffset,
            endOffset,
            color: color || '#ffeb3b',
            createdAt: new Date()
          }];
          break;

        case 'remove':
          const { startOffset: start, endOffset: end } = updateData.highlight;
          bookmark.highlights = bookmark.highlights?.filter(
            (h: { startOffset: number; endOffset: number }) => 
              h.startOffset !== start || h.endOffset !== end
          ) || [];
          break;

        case 'update':
          const { startOffset: updateStart, endOffset: updateEnd, color: newColor } = updateData.highlight;
          bookmark.highlights = bookmark.highlights?.map(
            (h: { startOffset: number; endOffset: number; color?: string }) => 
              h.startOffset === updateStart && h.endOffset === updateEnd
                ? { ...h, color: newColor }
                : h
          ) || [];
          break;

        default:
          return NextResponse.json(
            { message: 'Invalid highlight operation' },
            { status: 400 }
          );
      }

      await bookmark.save();
      return NextResponse.json(bookmark);
    }

    // Handle other update operations
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { ...updateData, updatedAt: new Date() },
      { new: true, lean: true }
    );

    if (!bookmark) {
      return NextResponse.json(
        { message: 'Bookmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bookmark);
  } catch (error: Error | unknown) {
    console.error('Bookmark update error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    await getConnection();

    // First verify the bookmark exists and belongs to the user
    const bookmark = await Bookmark.findOneAndDelete({
      _id: id,
      userId: session.user.id
    }).lean();

    if (!bookmark) {
      return NextResponse.json(
        { message: 'Bookmark not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Bookmark deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}