import React, { useEffect, useState } from 'react';
import { Auth } from '@/app/components/Auth';
import { LearnerDashboard } from '@/app/components/LearnerDashboard';
import { IssuerDashboard } from '@/app/components/IssuerDashboard';
import { VerifierDashboard } from '@/app/components/VerifierDashboard';
import { Button } from '@/app/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { toast, Toaster } from 'sonner';

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem('ssi_token');
    if (savedToken) {
      api.setToken(savedToken);
      loadUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (authToken: string) => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setToken(authToken);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('ssi_token');
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authToken: string, userData: any) => {
    localStorage.setItem('ssi_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const handleSignOut = async () => {
    try {
      await api.signout();
    } catch (error) {
      console.error('Signout error:', error);
    }
    
    localStorage.removeItem('ssi_token');
    api.setToken(null);
    setToken(null);
    setUser(null);
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SSI Microcredentials</h1>
                <p className="text-sm text-gray-600">{user.name} • {user.role}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {user.role === 'learner' && <LearnerDashboard user={user} />}
        {user.role === 'issuer' && <IssuerDashboard user={user} />}
        {user.role === 'verifier' && <VerifierDashboard user={user} />}
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
