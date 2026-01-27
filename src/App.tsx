import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BrowsePage from './pages/BrowsePage';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import CreateGroup from './pages/CreateGroup';
import Header from './components/layout/Header';
import { useStacksConnect } from './hooks/useStacksConnect';
import './App.css';

function App() {
  const { isConnected } = useStacksConnect();

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
              element={isConnected ? <Dashboard /> : <Navigate to="/" />} 
            />
            <Route path="/group/:id" element={<GroupDetails />} />
            <Route 
              path="/create" 
              element={isConnected ? <CreateGroup /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
        {/* Footer could go here */}
      </div>
    </Router>
  );
}

export default App;
