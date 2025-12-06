import { useState, useEffect } from 'react';
import { authAPI } from './services/api';
import OrganizationDashboard from './components/OrganizationDashboard';
import ConsultantDashboard from './components/ConsultantDashboard';
import NotificationContainer, { showSuccess, showError } from './components/Notificationcontainer';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: '',
    password: '',
    role: 'consultant',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;

      if (isLogin) {
        response = await authAPI.login({
          name: authForm.name,
          password: authForm.password,
        });
        
        localStorage.setItem('token', response.data.data.token);
        setUser(response.data.data.user);
        setShowAuthForm(false);
        setAuthForm({ name: '', password: '', role: 'consultant' });
        
        showSuccess(`Welcome back, ${response.data.data.user.name}!`, 'Login Successful');
      } else {
        response = await authAPI.register(authForm);
        
        showSuccess('Registration successful! Please login.', 'Account Created');
        setIsLogin(true);
        setAuthForm({ name: '', password: '', role: 'consultant' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMsg = error.response?.data?.message || 'Authentication failed';
      showError(errorMsg, isLogin ? 'Login Failed' : 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    showSuccess('Logged out successfully', 'Goodbye');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <NotificationContainer />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>🔐 Secure Data Sharing</h1>
              <p>Protected file sharing system</p>
            </div>

            {!showAuthForm ? (
              <div className="auth-welcome">
                <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>🛡️</div>
                <h2>Welcome</h2>
                
                <div className="btn-group" style={{ 
                  marginTop: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setShowAuthForm(true);
                    }}
                    className="btn btn-primary btn-lg"
                  >
                    🔑 Login
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setShowAuthForm(true);
                    }}
                    className="btn btn-secondary btn-lg"
                  >
                    📝 Register
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="auth-form">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>

                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, name: e.target.value })
                    }
                    placeholder="Enter your name"
                    className="form-control"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="form-control"
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      value={authForm.role}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, role: e.target.value })
                      }
                      className="form-control"
                      required
                    >
                      <option value="consultant">Consultant</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthForm(false);
                      setAuthForm({ name: '', password: '', role: 'consultant' });
                    }}
                    className="btn btn-secondary"
                  >
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
                  </button>
                </div>

                <p className="auth-switch">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setAuthForm({ name: '', password: '', role: 'consultant' });
                    }}
                    className="link-btn"
                  >
                    {isLogin ? 'Register here' : 'Login here'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NotificationContainer />
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>🔐 Secure Data Sharing</h1>
            <div className="user-info">
              <span className="user-name">
                {user.role === 'organization' ? '🏢' : '👤'} {user.name}
              </span>
              <span style={{ 
                fontSize: '0.8rem',
                background: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontWeight: 600,
                color: 'var(--gray-700)',
                border: '1px solid var(--gray-200)'
              }}>
                {user.role === 'organization' ? 'ORGANIZATION' : 'CONSULTANT'}
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            {user.role === 'organization' ? (
              <OrganizationDashboard />
            ) : (
              <ConsultantDashboard />
            )}
          </div>
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--gray-500)',
          fontSize: '0.85rem'
        }}>
          <p>Secure Data Sharing v2.3 - End-to-End Encrypted</p>
        </footer>
      </div>
    </>
  );
}

export default App;