import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BrowsePage from './pages/BrowsePage';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import Header from './components/layout/Header';
import { useStacksConnect } from './hooks/useStacksConnect';
import './App.css';

// Loading spinner component for protected routes
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary font-medium animate-pulse">Checking wallet connection...</p>
      </div>
    </div>
  );
}

// Protected route wrapper that shows loading during auth check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading } = useStacksConnect();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isConnected) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/group/:id" element={<GroupDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
