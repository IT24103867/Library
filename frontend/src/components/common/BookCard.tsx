import React from 'react';
import { FiBook, FiUser } from 'react-icons/fi';

interface Book {
  id: number;
  title: string;
  isbn: string;
  year: number;
  languageName: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt?: string;
  authorName?: string;
  publisherName?: string;
  categoryName?: string;
  averageRating?: number;
  totalReviews?: number;
}

interface BookCardProps {
  book: Book;
  onClick: (bookId: number) => void;
  className?: string;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick, className = '' }) => {
  return (
    <div
      onClick={() => onClick(book.id)}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer ${className}`}
    >
      <div className="flex flex-col">
        {/* Book Cover */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto w-full">
          {/* Blurred background image */}
          {book.coverImage && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 w-full"
              style={{
                backgroundImage: `url(http://localhost:8080${book.coverImage})`,
              }}
            />
          )}

          {/* Main cover image */}
          {book.coverImage ? (
            <img
              src={`http://localhost:8080${book.coverImage}`}
              alt={book.title}
              className="relative w-32 h-40 object-cover group-hover:scale-105 transition-transform duration-300 z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-book.png';
              }}
            />
          ) : (
            <div className="relative flex flex-col items-center justify-center text-gray-400 z-10">
              <FiBook className="w-8 h-8 mb-1" />
              <span className="text-xs">No Cover</span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
              {book.title}
            </h3>

            <div className="flex items-center text-sm text-gray-600 mb-2">
              <FiUser className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
              <span className="truncate">{book.authorName}</span>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < Math.floor(book.averageRating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {(book.averageRating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({book.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;