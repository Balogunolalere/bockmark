# Bockmark - Modern Bookmarking Application

A modern bookmarking application with a neobrutalist design aesthetic, built with Next.js 14, MongoDB, and NextAuth.js.

## Features

- User authentication with email/password
- Create and manage bookmarks with titles, URLs, and categories
- Tag-based organization
- Favorite bookmarks
- Clean, modern neobrutalist design
- Responsive layout

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd bockmark
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secure_random_string
   ```

   - Replace `your_mongodb_connection_string` with your MongoDB connection URL
   - Generate a secure random string for `NEXTAUTH_SECRET`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- Next.js 14
- MongoDB & Mongoose
- NextAuth.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod for validation

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and database configuration
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
