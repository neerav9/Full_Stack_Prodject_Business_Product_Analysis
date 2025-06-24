// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import PrivateRoute from './components/PrivateRoute';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'; // This import is correct

// Assuming you have AuthProvider, if not, add it back around <Router> or <Routes>
// import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    // If you have an AuthProvider, it should wrap the Router or Routes
    // <AuthProvider> 
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <PrivateRoute>
                  <ChangePasswordPage />
                </PrivateRoute>
              }
            />
            {/* THIS IS THE MISSING ROUTE FOR ANALYTICS DASHBOARD */}
            <Route
              path="/analytics-dashboard"
              element={
                <PrivateRoute>
                  <AnalyticsDashboardPage />
                </PrivateRoute>
              }
            />
            {/* Add more routes here as needed */}
            {/* Fallback for undefined routes */}
            <Route path="*" element={<p>Page Not Found</p>} />
          </Routes>
        </div>
      </Router>
    // </AuthProvider>
  );
}

export default App;