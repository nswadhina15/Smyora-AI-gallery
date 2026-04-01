import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import Albums from './pages/Albums';
import AlbumDetails from './pages/AlbumDetails';
import Settings from './pages/Settings';
import LifeMap from './pages/LifeMap';
import Vault from './pages/Vault';
import Cleanup from './pages/Cleanup';
import People from './pages/People';
import Analytics from './pages/Analytics';

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={currentUser ? <Navigate to="/" replace /> : <Signup />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/albums" 
          element={
            <ProtectedRoute>
              <Albums />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/albums/:albumId" 
          element={
            <ProtectedRoute>
              <AlbumDetails />
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

        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <LifeMap />
            </ProtectedRoute>
          } 
        />

        <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="/cleanup" element={<ProtectedRoute><Cleanup /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><People /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;