import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { BookCard } from '../components/common';
import { useToast } from '../components/Toast';
import { FiArrowLeft, FiBook, FiUser, FiHome, FiCalendar, FiGlobe, FiTag, FiCopy, FiStar } from 'react-icons/fi';

interface Book {
  id: number;
  title: string;
  isbn: string;
  authorName: string;
  publisherName: string;
  categoryName: string;
  languageName: string;
  year: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  // Optional fields for detailed view
  description?: string;
  coverImage?: string;
  updatedAt?: string;
}

interface BookReview {
  id: number;
  userId: number;
  bookId: number;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
}

interface BookCopy {
  id: number;
  bookId: number;
  status: string;
  condition: string;
  location?: string;
  createdAt: string;
}

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [otherBooks, setOtherBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<BookReview | null>(null);

  useEffect(() => {
    if (id) {
      fetchBookDetails();
      fetchBookCopies();
      fetchBookReviews();
      fetchOtherBooksByAuthor();
    }
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }

      const bookData = await response.json();
      setBook(bookData);
      // Fetch other books by author after book details are loaded
      setTimeout(() => fetchOtherBooksByAuthor(bookData.authorName, bookData.id), 100);
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookCopies = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/${id}/copies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const copiesData = await response.json();
        setCopies(copiesData);
      }
    } catch (err) {
      console.error('Error fetching book copies:', err);
    }
  };

  const fetchBookReviews = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/${id}/reviews?page=0&pageSize=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);

        // Check if current user has reviewed
        if (user?.id) {
          const userReviewData = reviewsData.find((review: BookReview) => review.userId === parseInt(user.id));
          setUserReview(userReviewData || null);

          // If user has reviewed, populate the form with their existing review
          if (userReviewData) {
            setReviewRating(userReviewData.rating);
            setReviewText(userReviewData.review || '');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching book reviews:', err);
    }
  };

  const fetchOtherBooksByAuthor = async (authorName?: string, currentBookId?: number) => {
    const nameToUse = authorName || book?.authorName;
    if (!nameToUse) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/search?query=${encodeURIComponent(nameToUse)}&pageSize=6`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const booksData = await response.json();
        // Filter out the current book
        const bookIdToExclude = currentBookId || book?.id;
        const filteredBooks = booksData.filter((b: Book) => b.id !== bookIdToExclude);
        setOtherBooks(filteredBooks.slice(0, 5)); // Show max 5 other books
      }
    } catch (err) {
      console.error('Error fetching other books by author:', err);
    }
  };

  const handleBorrowBook = async (copyId: number) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookCopyId: copyId,
          userId: user?.id
        })
      });

      if (response.ok) {
        // Refresh copies after borrowing
        fetchBookCopies();
        alert('Book borrowed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to borrow book: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error borrowing book:', err);
      alert('Failed to borrow book. Please try again.');
    }
  };

  const handleRequestBook = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/book-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: book?.id,
          userId: user?.id
        })
      });

      if (response.ok) {
        showToast('success', 'Request Submitted', 'Your book request has been submitted successfully!');
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          // Conflict - user already has a pending request
          showToast('warning', 'Request Already Pending', errorData.message || 'You already have a pending request for this book.');
        } else {
          // Other errors
          showToast('error', 'Request Failed', errorData.message || 'Failed to submit book request. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error requesting book:', err);
      showToast('error', 'Request Failed', 'Failed to submit book request. Please check your connection and try again.');
    }
  };

  const handleSubmitReview = async () => {
    if (!book || reviewText.trim().length === 0) return;

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const isUpdate = !!userReview;

      const response = await fetch(
        isUpdate
          ? `http://localhost:8080/api/book-reviews/${userReview.id}`
          : 'http://localhost:8080/api/book-reviews',
        {
          method: isUpdate ? 'PATCH' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookId: book.id,
            rating: reviewRating,
            review: reviewText.trim()
          })
        }
      );

      if (response.ok) {
        // Refresh reviews after submitting
        fetchBookReviews();
        setShowReviewForm(false);
        showToast('success', isUpdate ? 'Review Updated' : 'Review Submitted', `Your review has been ${isUpdate ? 'updated' : 'submitted'} successfully!`);
      } else {
        const errorData = await response.json();
        showToast('error', `Failed to ${isUpdate ? 'Update' : 'Submit'} Review`, errorData.message || 'Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('error', 'Failed to Submit Review', 'Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const availableCopies = copies.filter(copy => copy.status === 'AVAILABLE');

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'Member'}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userName={user?.username || 'User'}
            userDisplayName={user?.name}
            userRole={user?.role || 'Member'}
            profilePicture={user?.profilePicture}
            onProfileClick={() => {}}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Back Button Skeleton */}
              <div className="mb-6 lg:mb-8">
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column Skeleton */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Cover Skeleton */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4 sm:p-6 space-y-3">
                      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>

                  {/* Review Form Skeleton */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                  <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-6 w-1/2"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'Member'}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userName={user?.username || 'User'}
            userDisplayName={user?.name}
            userRole={user?.role || 'Member'}
            profilePicture={user?.profilePicture}
            onProfileClick={() => {}}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Back Button */}
              <div className="mb-6 lg:mb-8">
                <button
                  onClick={() => navigate('/books')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                  Back to Books
                </button>
              </div>

              {/* Error State */}
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-md w-full">
                  <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                    <FiBook className="w-8 h-8 text-red-600 mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {error || "The book you're looking for doesn't exist or has been removed."}
                  </p>
                  <button
                    onClick={() => navigate('/books')}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Browse All Books
                  </button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role || 'Member'}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={user?.username || 'User'}
          userDisplayName={user?.name}
          userRole={user?.role || 'Member'}
          profilePicture={user?.profilePicture}
          onProfileClick={() => {}}
        />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Back Button */}
            <div className="mb-6 lg:mb-8">
              <button
                onClick={() => navigate('/books')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
              >
                <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Books
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Cover and Reviews */}
              <div className="xl:col-span-1 space-y-6">
                {/* Book Cover Card */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Cover Image with Blurred Background */}
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden aspect-square">
                    {/* Blurred background image */}
                    {book.coverImage && (
                      <div
                        className="absolute inset-0 h-full bg-cover bg-center filter blur-sm scale-110 opacity-60"
                        style={{
                          backgroundImage: `url(http://localhost:8080${book.coverImage})`,
                        }}
                      />
                    )}

                    {/* Main cover image */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                      {book.coverImage ? (
                        <img
                          src={`http://localhost:8080${book.coverImage}`}
                          alt={book.title}
                          className="h-full aspect-[3/4] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-book.png';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 w-full max-w-xs">
                          <FiBook className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-gray-300" />
                          <span className="text-base sm:text-lg font-medium text-center">No Cover Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4 sm:p-6 space-y-3">
                    {user?.role === 'Member' && availableCopies.length > 0 && (
                      <button
                        onClick={() => handleBorrowBook(availableCopies[0].id)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center text-sm sm:text-base"
                      >
                        <FiBook className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Borrow This Book
                      </button>
                    )}

                    {user?.role === 'Member' && availableCopies.length === 0 && (
                      <button
                        onClick={() => handleRequestBook()}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center text-sm sm:text-base"
                      >
                        <FiCopy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Request This Book
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Section - Only for Members */}
                {user?.role === 'Member' && (
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg mr-3">
                          <FiStar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          {userReview ? 'Your Review' : 'Write a Review'}
                        </h3>
                      </div>
                      {!showReviewForm && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                        >
                          {userReview ? 'Edit Review' : 'Add Review'}
                        </button>
                      )}
                    </div>

                    {/* Show existing review if user has reviewed */}
                    {userReview && !showReviewForm && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < userReview.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium text-gray-600">
                            {userReview.rating}/5 stars
                          </span>
                        </div>
                        {userReview.review && (
                          <p className="text-gray-700 text-sm leading-relaxed">{userReview.review}</p>
                        )}
                      </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && (
                      <div className="space-y-4">
                        {/* Star Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-1 transition-transform hover:scale-110"
                                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                              >
                                <FiStar
                                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                    star <= reviewRating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 hover:text-yellow-300'
                                  } transition-colors`}
                                />
                              </button>
                            ))}
                            <span className="ml-3 text-sm font-medium text-gray-600" aria-live="polite">
                              {reviewRating}/5 stars
                            </span>
                          </div>
                        </div>

                        {/* Review Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share your thoughts about this book..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                            rows={4}
                            maxLength={1000}
                            aria-describedby="review-char-count"
                          />
                          <div id="review-char-count" className="text-xs text-gray-500 mt-1 text-right">
                            {reviewText.length}/1000 characters
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || reviewText.trim().length === 0}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                            aria-describedby={submittingReview ? "submitting-status" : undefined}
                          >
                            {submittingReview ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                                <span id="submitting-status">Submitting...</span>
                              </>
                            ) : (
                              <>
                                <FiStar className="w-4 h-4 mr-2" aria-hidden="true" />
                                {userReview ? 'Update Review' : 'Submit Review'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              // Reset to original values if cancelling edit
                              if (userReview) {
                                setReviewRating(userReview.rating);
                                setReviewText(userReview.review || '');
                              } else {
                                setReviewRating(5);
                                setReviewText('');
                              }
                            }}
                            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors duration-200 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                {reviews.filter(review => review.userId !== parseInt(user?.id || '0')).length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg mr-3">
                          <FiStar className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Reviews</h3>
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium" aria-label={`${reviews.filter(review => review.userId !== parseInt(user?.id || '0')).length} reviews`}>
                        {reviews.filter(review => review.userId !== parseInt(user?.id || '0')).length}
                      </span>
                    </div>

                    <div
                      className="space-y-4 max-h-96 overflow-y-auto content-scrollbar"
                      role="region"
                      aria-label="Book reviews"
                      aria-live="polite"
                    >
                      {reviews
                        .filter(review => review.userId !== parseInt(user?.id || '0'))
                        .map((review) => (
                        <article key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                          <header className="flex items-start justify-between mb-3">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="bg-gray-100 p-2 rounded-full mr-3 flex-shrink-0">
                                <FiUser className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" aria-hidden="true" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 text-sm truncate">User #{review.userId}</p>
                                <div className="flex items-center mt-1" role="img" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar
                                      key={i}
                                      className={`w-3 h-3 flex-shrink-0 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <time className="text-xs text-gray-500 flex-shrink-0 ml-2" dateTime={review.createdAt}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </time>
                          </header>
                          {review.review && (
                            <div className="bg-gray-50 rounded-lg p-3 mt-3">
                              <p className="text-gray-700 text-sm leading-relaxed break-words">{review.review}</p>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg mr-3">
                          <FiStar className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Reviews</h3>
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium" aria-label="0 reviews">
                        0
                      </span>
                    </div>

                    <div className="text-center py-8">
                      <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                        <FiStar className="w-8 h-8 text-gray-400 mx-auto" aria-hidden="true" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Be the first to share your thoughts about this book!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Book Details */}
              <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                {/* Title and Rating Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                  <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">{book.title}</h1>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Rating Badge */}
                      <div className="flex items-center bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                        <div className="flex items-center mr-2">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                i < Math.floor(book.averageRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-700 font-semibold text-sm sm:text-base">
                          {book.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 text-sm ml-1">
                          ({book.totalReviews} reviews)
                        </span>
                      </div>

                      {/* Availability Badge */}
                      <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                        availableCopies.length > 0
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <FiBook className="w-4 h-4 mr-2" />
                        {availableCopies.length > 0
                          ? `${availableCopies.length} available`
                          : 'Not available'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Book Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiUser className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Author</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{book.authorName}</p>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                        <div className="bg-green-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiHome className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Publisher</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{book.publisherName}</p>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                        <div className="bg-purple-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Publication Year</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900">{book.year}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                        <div className="bg-indigo-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiTag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Category</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{book.categoryName}</p>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
                        <div className="bg-teal-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiGlobe className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">Language</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{book.languageName}</p>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="bg-gray-100 p-3 rounded-lg mr-4 flex-shrink-0">
                          <FiCopy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">ISBN</p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900 font-mono break-all">{book.isbn}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
                        <FiBook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Description</h2>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                      <p className="text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">{book.description}</p>
                    </div>
                  </div>
                )}

                {/* Other Books by Author */}
                {otherBooks.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg mr-3">
                          <FiUser className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Other Books by {book.authorName}</h2>
                      </div>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium" aria-label={`${otherBooks.length} other books by this author`}>
                        {otherBooks.length} books
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="list" aria-label={`Other books by ${book.authorName}`}>
                      {otherBooks.map((otherBook) => (
                        <BookCard
                          key={otherBook.id}
                          book={otherBook}
                          onClick={(bookId) => navigate(`/books/${bookId}`)}
                          className="h-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default BookDetail;