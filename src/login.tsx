import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './app.css'; // Import your CSS file here

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map username to the internal dummy email
    const dummyEmail = `${username.toLowerCase()}@powerpeace.org`;

    const { error } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: password,
    });

    if (error) {
      setError("Access denied. Check your Player ID and Access Key.");
      setLoading(false);
    } else {
      window.location.href = '/dashboard/economy'; 
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
            placeholder="e.g. player89"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Access Key</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Authenticating...' : 'Enter the Game'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;