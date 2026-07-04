import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProfileDashboard } from './pages/ProfileDashboard';

const AppContent: React.FC = () => {
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const handleNavigateToDashboard = (username: string) => {
    setCurrentUsername(username);
  };

  const handleNavigateHome = () => {
    setCurrentUsername(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentUsername ? (
        <ProfileDashboard 
          username={currentUsername} 
          onNavigateHome={handleNavigateHome} 
        />
      ) : (
        <Login onNavigateToDashboard={handleNavigateToDashboard} />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
