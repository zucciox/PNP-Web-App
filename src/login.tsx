import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getErrorMessage = (err: any) => {
    // Supabase error messages often come in err.message or err.status
    const message = err.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return "Incorrect Player ID or Access Key. Please try again.";
    }
    if (message.includes('email not confirmed')) {
      return "Your account hasn't been activated yet. Check your inbox.";
    }
    if (message.includes('too many requests') || err.status === 429) {
      return "Too many failed attempts. Please wait a few minutes before trying again.";
    }
    if (message.includes('network') || err.status === 500) {
      return "Connection error. Please check your internet and try again.";
    }
    
    // Fallback for unexpected errors
    return err.message || "An unexpected error occurred. Please contact support.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client-side validation before hitting the API
    if (username.trim().length < 3) {
      setError("Player ID must be at least 3 characters.");
      setLoading(false);
      return;
    }

    const dummyEmail = `${username.trim().toLowerCase()}@powerpeace.org`;

    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: password,
    });

    if (supabaseError) {
      setError(getErrorMessage(supabaseError));
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <header className="login-header">
          <h1>Power & Peace</h1>
          <p>Game Login</p>
        </header>
        
        <div className="input-group">
          <label htmlFor="username">Player ID</label>
          <input
            id="username"
            type="text"
            className={error && error.includes('ID') ? 'input-error' : ''}
            placeholder="e.g. player89"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Access Key</label>
          <input
            id="password"
            type="password"
            className={error && error.includes('Key') ? 'input-error' : ''}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? (
            <span className="loader-text">Verifying Credentials...</span>
          ) : (
            'Enter the Game'
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;