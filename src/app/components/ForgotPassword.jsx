'use client';

import { useState } from 'react';
import LoadingOverlay from './LoadingOverlay'; 

const RequestResetPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  const handleResetRequest = async () => {
    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true); 
    setError('');
    setMessage('');

    try {
      // Call your backend API endpoint for password reset
      // Adjust the path to match your backend route structure
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          email,
          resetUrl: `${window.location.origin}/auth-verf`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send reset email');
      }

      setMessage(data.message || 'Password reset email sent! Check your inbox.');
      setError('');
      
      // Clear email field after successful request
      setEmail('');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
      setMessage('');
    } finally {
      setLoading(false); 
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleResetRequest();
    }
  };

  return (
    <div className="min-h-screen  flex flex-row items-start text-white relative">
      {loading && <LoadingOverlay />}
      <div className="p-5 rounded-lg my-20 mx-20 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1 text-green-300">Reset Password</h2>
        <p className="py-4 mb-6 text-white">
          An email will be sent to your verified email address.
          Click on the link to reset your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full p-2 mb-4 ring-1 ring-white rounded-2xl bg-gray-700 text-white focus:outline-none"
          disabled={loading}
        />

        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        {message && <p className="text-green-400 mb-2 text-sm">{message}</p>}

        <button
          onClick={handleResetRequest}
          disabled={loading}
          className="w-full bg-green-400 text-black py-2 rounded-2xl hover:bg-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </div>
    </div>
  );
};

export default RequestResetPage;