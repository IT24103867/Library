import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { SearchBar, LoadingSpinner, EmptyState, Pagination, Dropdown, FloatingActionButton, Modal, DeleteConfirmModal, BookCard } from '../components/common';
import { useToast } from '../components/Toast';
import { FiBook, FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiCalendar, FiUser, FiHome, FiGlobe, FiCopy } from 'react-icons/fi';

// Types
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

interface Author {
  id: number;
  name: string;
}

interface Publisher {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Language {
  id: number;
  name: string;
  code?: string;
}

const Books: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Related data
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form
  const [formData, setFormData] = useState({
    title: '',
    authorId: '',
    publisherId: '',
    isbn: '',
    year: new Date().getFullYear().toString(),
    languageId: '',
    categoryId: '',
    description: '',
    coverImage: null as File | null
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Search cache and debouncing
  const searchCache = useRef(new Map<string, any>());
  const searchTimeoutRef = useRef<number | null>(null);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Debounce search term changes
  useEffect(() => {
    setIsSearchDebouncing(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearchDebouncing(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch related data
  const fetchRelatedData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [authorsRes, publishersRes, categoriesRes, languagesRes] = await Promise.all([
        fetch('http://localhost:8080/api/authors?page=0&pageSize=1000', { headers }),
        fetch('http://localhost:8080/api/publishers?page=0&pageSize=1000', { headers }),
        fetch('http://localhost:8080/api/categories?page=0&pageSize=1000', { headers }),
        fetch('http://localhost:8080/api/languages?page=0&pageSize=1000', { headers })
      ]);

      if (authorsRes.ok) {
        const authorsData = await authorsRes.json();
        setAuthors(authorsData);
      }

      if (publishersRes.ok) {
        const publishersData = await publishersRes.json();
        setPublishers(publishersData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (languagesRes.ok) {
        const languagesData = await languagesRes.json();
        setLanguages(languagesData);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  }, []);

  // Fetch books
  const fetchBooks = useCallback(async (page: number, signal: AbortSignal) => {
    const effectiveSearchTerm = debouncedSearchTerm.trim();
    if (effectiveSearchTerm && effectiveSearchTerm.length < 2) {
      setBooks([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      let url = `http://localhost:8080/api/books?page=${page}&pageSize=10`;

      // Use search endpoint if we have search criteria
      if (effectiveSearchTerm || selectedCategory || selectedAuthor || selectedPublisher || selectedLanguage) {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '10'
        });

        if (effectiveSearchTerm) params.append('query', effectiveSearchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedAuthor) params.append('author', selectedAuthor);
        if (selectedPublisher) params.append('publisher', selectedPublisher);
        if (selectedLanguage) params.append('language', selectedLanguage);

        url = `http://localhost:8080/api/books/search?${params.toString()}`;
      }

      const cacheKey = `${url}`;
      if (searchCache.current.has(cacheKey)) {
        const cachedData = searchCache.current.get(cacheKey);
        setBooks(cachedData.content || cachedData);
        setTotalPages(cachedData.totalPages || 1);
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (!res.ok) {
        console.error('Failed to fetch books - Status:', res.status);
        setBooks([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();

      // Books now come with names directly from API - no enrichment needed
      const booksData = (data.content || data).map((book: Book) => ({
        ...book,
        // Ensure rating fields are numbers
        averageRating: book.averageRating || 0,
        totalReviews: book.totalReviews || 0
      }));

      searchCache.current.set(cacheKey, { ...data, content: booksData });

      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value;
        if (firstKey) searchCache.current.delete(firstKey);
      }

      setBooks(booksData);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching books:', err);
        setBooks([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedCategory, selectedAuthor, selectedPublisher, selectedLanguage, authors, publishers, categories]);

  // Effects
  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBooks(currentPage, controller.signal);
    return () => controller.abort();
  }, [currentPage, fetchBooks]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, selectedCategory, selectedAuthor, selectedPublisher, selectedLanguage]);

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    searchCache.current.clear();
  }, []);

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, coverImage: file }));
  };

  // CRUD Operations
  const submitAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    // Validate ISBN
    if (!validateISBN(formData.isbn)) {
      setFormError('Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13.');
      setFormLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('authorId', formData.authorId);
      formDataToSend.append('publisherId', formData.publisherId);
      formDataToSend.append('isbn', formData.isbn);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('languageId', formData.languageId);
      formDataToSend.append('categoryId', formData.categoryId);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.coverImage) formDataToSend.append('coverImage', formData.coverImage);

      const response = await fetch('http://localhost:8080/api/books', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowAddModal(false);
        clearSearchCache();
        const controller = new AbortController();
        fetchBooks(currentPage, controller.signal);
        showToast('success', 'Book Added', `${formData.title} has been added successfully.`);
        resetForm();
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to add book');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    setFormLoading(true);
    setFormError('');

    // Validate ISBN
    if (!validateISBN(formData.isbn)) {
      setFormError('Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13.');
      setFormLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('authorId', formData.authorId);
      formDataToSend.append('publisherId', formData.publisherId);
      formDataToSend.append('isbn', formData.isbn);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('languageId', formData.languageId);
      formDataToSend.append('categoryId', formData.categoryId);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.coverImage) formDataToSend.append('coverImage', formData.coverImage);

      const response = await fetch(`http://localhost:8080/api/books/${selectedBook.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedBook(null);
        clearSearchCache();
        const controller = new AbortController();
        fetchBooks(currentPage, controller.signal);
        showToast('success', 'Book Updated', `${formData.title} has been updated successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to update book');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteBook = async () => {
    if (!selectedBook) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedBook(null);
        clearSearchCache();
        const controller = new AbortController();
        fetchBooks(currentPage, controller.signal);
        showToast('success', 'Book Deleted', 'The book has been deleted successfully.');
      } else {
        try {
          const errorData = await response.json();
          showToast('error', 'Failed to Delete Book', errorData.message || 'Please try again.');
        } catch {
          showToast('error', 'Failed to Delete Book', 'Please try again.');
        }
      }
    } catch (error) {
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // ISBN validation function
  const validateISBN = (isbn: string): boolean => {
    // Remove hyphens and spaces for validation
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check if it's 10 or 13 digits
    if (cleanISBN.length === 10) {
      // ISBN-10 validation
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanISBN[i]) * (10 - i);
      }
      const checkDigit = cleanISBN[9].toUpperCase();
      const calculatedCheck = (11 - (sum % 11)) % 11;
      const expectedCheck = calculatedCheck === 10 ? 'X' : calculatedCheck.toString();
      return checkDigit === expectedCheck;
    } else if (cleanISBN.length === 13) {
      // ISBN-13 validation
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanISBN[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = parseInt(cleanISBN[12]);
      const calculatedCheck = (10 - (sum % 10)) % 10;
      return checkDigit === calculatedCheck;
    }
    
    return false;
  };

  // Modal handlers
  const handleAddBook = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditBook = async (book: Book) => {
    try {
      // Fetch full book details with IDs for editing
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/books/${book.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const fullBookData = await res.json();
        setSelectedBook(fullBookData);
        setFormData({
          title: fullBookData.title,
          authorId: fullBookData.authorId.toString(),
          publisherId: fullBookData.publisherId.toString(),
          isbn: fullBookData.isbn,
          year: fullBookData.year.toString(),
          languageId: fullBookData.languageId.toString(),
          categoryId: fullBookData.categoryId.toString(),
          description: fullBookData.description || '',
          coverImage: null
        });
        setShowEditModal(true);
      } else {
        showToast('Failed to load book details for editing', 'error');
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      showToast('Failed to load book details for editing', 'error');
    }
  };

  const handleViewCopies = (book: Book) => {
    navigate(`/books/${book.id}/copies`);
  };

  const handleDeleteBook = (book: Book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      authorId: '',
      publisherId: '',
      isbn: '',
      year: new Date().getFullYear().toString(),
      languageId: '',
      categoryId: '',
      description: '',
      coverImage: null
    });
    setFormError('');
  };

  // Filtered books (for local filtering if needed)
  const filteredBooks = books;

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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <SearchBar
                      placeholder="Search books by title, ISBN, or author..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                      className="w-full"
                    />
                    {isSearchDebouncing && searchTerm.trim().length >= 2 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600 mr-1"></div>
                          Searching...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Categories' },
                      ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
                    ]}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="Category"
                    className="w-40"
                  />

                  {/* Author Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Authors' },
                      ...authors.map(author => ({ value: author.id.toString(), label: author.name }))
                    ]}
                    value={selectedAuthor}
                    onChange={setSelectedAuthor}
                    placeholder="Author"
                    className="w-40"
                  />

                  {/* Publisher Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Publishers' },
                      ...publishers.map(pub => ({ value: pub.id.toString(), label: pub.name }))
                    ]}
                    value={selectedPublisher}
                    onChange={setSelectedPublisher}
                    placeholder="Publisher"
                    className="w-40"
                  />

                  {/* Language Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Languages' },
                      ...languages.map(lang => ({ value: lang.id.toString(), label: lang.name }))
                    ]}
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    placeholder="Language"
                    className="w-40"
                  />

                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedAuthor('');
                      setSelectedPublisher('');
                      setSelectedLanguage('');
                      setSearchTerm('');
                      clearSearchCache();
                    }}
                    className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner message="Loading books..." />
                ) : user?.role === 'Member' ? (
                  // Card view for members
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {filteredBooks.length === 0 ? (
                      <div className="col-span-full">
                        <EmptyState
                          icon={FiBook}
                          title="No books found"
                          description={searchTerm || selectedCategory || selectedAuthor || selectedPublisher || selectedLanguage ?
                            "Try adjusting your search criteria or filters" :
                            "No books available in the library at the moment"}
                        />
                      </div>
                    ) : (
                      filteredBooks.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          onClick={(bookId) => navigate(`/books/${bookId}`)}
                        />
                      ))
                    )}
                  </div>
                ) : (
                // Table view for admins and librarians
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Book Details
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Author & Publisher
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Category & Language
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Publication & Rating
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/60">
                      {filteredBooks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center">
                            <EmptyState
                              icon={FiBook}
                              title="No books found"
                              description={searchTerm || selectedCategory || selectedAuthor || selectedPublisher || selectedLanguage ?
                                "Try adjusting your search criteria or filters" :
                                "Start by adding your first book to the collection"}
                              actionButton={filteredBooks.length === 0 && !loading ? {
                                label: "Add First Book",
                                onClick: handleAddBook
                              } : undefined}
                            />
                          </td>
                        </tr>
                      ) : (
                        filteredBooks.map((book) => (
                          <tr key={book.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-8 py-6">
                              <div className="flex items-center">
                                {book.coverImage && (
                                  <img
                                    src={`http://localhost:8080${book.coverImage}`}
                                    alt={book.title}
                                    className="w-12 h-16 object-cover rounded-lg mr-4 shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-book.png';
                                    }}
                                  />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                    {book.title}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    ISBN: {book.isbn}
                                  </div>
                                  {book.description && (
                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                      {book.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm text-gray-900 font-medium">
                                <FiUser className="inline w-4 h-4 mr-1" />
                                {book.authorName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <FiHome className="inline w-4 h-4 mr-1" />
                                {book.publisherName}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm text-gray-900 font-medium">
                                {book.categoryName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <FiGlobe className="inline w-4 h-4 mr-1" />
                                {book.languageName}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm text-gray-900 font-medium">
                                <FiCalendar className="inline w-4 h-4 mr-1" />
                                {book.year}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Added {new Date(book.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center mt-2">
                                <div className="flex items-center mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-xs ${
                                        i < Math.floor(book.averageRating || 0)
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {(book.averageRating || 0).toFixed(1)} ({book.totalReviews || 0})
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleEditBook(book)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="Edit Book"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewCopies(book)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="View Copies"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete Book"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredBooks.length > 0 && (
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page <span className="font-semibold text-gray-900">{currentPage + 1}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="justify-end"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </main>

        {(user?.role === 'Admin' || user?.role === 'Librarian') && (
          <FloatingActionButton
            onClick={handleAddBook}
            icon={FiPlus}
            title="Add New Book"
          />
        )}

        {/* Add Book Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Book"
          size="xl"
        >
          <BookForm
            formData={formData}
            onFormChange={handleFormChange}
            onFileChange={handleFileChange}
            onSubmit={submitAddBook}
            isLoading={formLoading}
            error={formError}
            authors={authors}
            publishers={publishers}
            categories={categories}
            languages={languages}
            isEdit={false}
          />
        </Modal>

        {/* Edit Book Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Book"
          size="xl"
        >
          <BookForm
            formData={formData}
            onFormChange={handleFormChange}
            onFileChange={handleFileChange}
            onSubmit={submitEditBook}
            isLoading={formLoading}
            error={formError}
            authors={authors}
            publishers={publishers}
            categories={categories}
            languages={languages}
            isEdit={true}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBook}
          itemName={selectedBook?.title || ''}
          itemType="Book"
          isLoading={formLoading}
        />
      </div>
    </div>
  );
};

// Book Form Component
interface BookFormProps {
  formData: {
    title: string;
    authorId: string;
    publisherId: string;
    isbn: string;
    year: string;
    languageId: string;
    categoryId: string;
    description: string;
    coverImage: File | null;
  };
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  authors: Author[];
  publishers: Publisher[];
  categories: Category[];
  languages: Language[];
  isEdit: boolean;
}

const BookForm: React.FC<BookFormProps> = ({
  formData,
  onFormChange,
  onFileChange,
  onSubmit,
  isLoading,
  error,
  authors,
  publishers,
  categories,
  languages,
  isEdit
}) => {
  // Handle dropdown changes by creating synthetic events
  const handleDropdownChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onFormChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter book title"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author *
          </label>
          <Dropdown
            options={authors.map(author => ({ value: author.id.toString(), label: author.name }))}
            value={formData.authorId}
            onChange={(value) => handleDropdownChange('authorId', value)}
            placeholder="Select Author"
            className="w-full"
          />
        </div>

        {/* Publisher */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publisher *
          </label>
          <Dropdown
            options={publishers.map(publisher => ({ value: publisher.id.toString(), label: publisher.name }))}
            value={formData.publisherId}
            onChange={(value) => handleDropdownChange('publisherId', value)}
            placeholder="Select Publisher"
            className="w-full"
          />
        </div>

        {/* ISBN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ISBN *
          </label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={onFormChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter ISBN"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publication Year *
          </label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={onFormChange}
            required
            min="1000"
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <Dropdown
            options={categories.map(category => ({ value: category.id.toString(), label: category.name }))}
            value={formData.categoryId}
            onChange={(value) => handleDropdownChange('categoryId', value)}
            placeholder="Select Category"
            className="w-full"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language *
          </label>
          <Dropdown
            options={languages.map(lang => ({ value: lang.id.toString(), label: lang.name }))}
            value={formData.languageId}
            onChange={(value) => handleDropdownChange('languageId', value)}
            placeholder="Select Language"
            className="w-full"
          />
        </div>

        {/* Cover Image */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onFormChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Enter book description (optional)"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {}}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
              {isEdit ? 'Updating...' : 'Adding...'}
            </div>
          ) : (
            isEdit ? 'Update Book' : 'Add Book'
          )}
        </button>
      </div>
    </form>
  );
};

export default Books;