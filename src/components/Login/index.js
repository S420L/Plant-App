import React, { useState } from 'react';
import axios from 'axios';
import { setToken } from '../../data/auth';
import {
  LoginContainer,
  LoginCard,
  LoginTitle,
  LoginSubtitle,
  LoginField,
  LoginLabel,
  LoginInput,
  LoginButton,
  LoginToggle,
  LoginError,
} from './wrappers';

const API_BASE = 'https://server67.site';

export const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`${API_BASE}${path}`, { username, password });
      setToken(response.data.token);
      onLogin();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <LoginContainer>
      <LoginCard onSubmit={handleSubmit}>
        <LoginTitle>PlantApp</LoginTitle>
        <LoginSubtitle>
          {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
        </LoginSubtitle>

        <LoginField>
          <LoginLabel>Username</LoginLabel>
          <LoginInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            minLength={3}
            maxLength={64}
          />
        </LoginField>

        <LoginField>
          <LoginLabel>Password</LoginLabel>
          <LoginInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </LoginField>

        {error && <LoginError>{error}</LoginError>}

        <LoginButton type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </LoginButton>

        <LoginToggle type="button" onClick={toggleMode}>
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </LoginToggle>
      </LoginCard>
    </LoginContainer>
  );
};
