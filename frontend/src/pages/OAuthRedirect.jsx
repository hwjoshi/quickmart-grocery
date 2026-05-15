import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    console.log('OAuth redirect - token:', token ? 'present' : 'missing');
    if (token) {
      localStorage.setItem('token', token);
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(userData => {
          console.log('User data fetched:', userData);
          setUser(userData);
          navigate('/');
        })
        .catch(err => {
          console.error('OAuth fetch user error:', err);
          setError('Failed to complete login. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        });
    } else {
      console.error('No token in URL');
      setError('Missing authentication token. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate, setUser]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4">Completing login...</p>
      </div>
    </div>
  );
}