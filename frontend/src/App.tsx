import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import BookCopies from './pages/BookCopies';
import Authors from './pages/Authors';
import Publishers from './pages/Publishers';
import Categories from './pages/Categories';
import Languages from './pages/Languages';
import Transactions from './pages/Transactions';
import Fines from './pages/Fines';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books"
                  element={
                    <ProtectedRoute>
                      <Books />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/:id"
                  element={
                    <ProtectedRoute>
                      <BookDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/:bookId/copies"
                  element={
                    <ProtectedRoute>
                      <BookCopies />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/authors"
                  element={
                    <ProtectedRoute>
                      <Authors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/publishers"
                  element={
                    <ProtectedRoute>
                      <Publishers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute>
                      <Categories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/languages"
                  element={
                    <ProtectedRoute>
                      <Languages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fines"
                  element={
                    <ProtectedRoute>
                      <Fines />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
};export default App;