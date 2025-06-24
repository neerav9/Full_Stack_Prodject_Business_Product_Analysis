// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
// import ProtectedRoute from './components/ProtectedRoute'; // Still commented out as per our previous plan
import { AuthProvider } from './context/AuthContext';
import UserWebsitesPage from './pages/UserWebsitesPage';
import AddWebsitePage from './pages/AddWebsitePage';
import EventListPage from './pages/EventListPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// NEW: Import ManualEventCreatorPage
import ManualEventCreatorPage from './pages/ManualEventCreatorPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Temporarily public routes (or protected if you re-enabled ProtectedRoute) */}
          <Route path="/user-websites" element={<UserWebsitesPage />} />
          <Route path="/add-website" element={<AddWebsitePage />} />
          <Route path="/analytics-dashboard" element={<AnalyticsDashboardPage />} />
          <Route path="/analytics/events-list" element={<EventListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* NEW: Route for Manual Event Creator Page */}
          <Route path="/analytics/manual-event" element={<ManualEventCreatorPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Catch all for 404 - make sure this is the last route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
