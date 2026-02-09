'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowBigLeft } from 'lucide-react';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../api/firebase';
import LoadingOverlay from './LoadingOverlay'; 

const NewPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const params = useSearchParams();
  const router = useRouter();
  const oobCode = params.get('oobCode');

  const handleSubmit = async () => {
    if (!oobCode) {
      setError('Invalid or missing reset code.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage('Password updated successfully!');
      setError('');
      setTimeout(() => router.push('/conf-pag'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-950 to-black text-white relative">
      {loading && <LoadingOverlay />}

      <div className="absolute top-8 left-6 bg-white text-sm font-medium border rounded-4xl p-3 cursor-pointer">
        <span className="text-green-600 text-2xl">
          <ArrowBigLeft />
        </span>
      </div>

      {/* Form Section */}
      <div className="max-w-sm w-full">
        <h2 className="text-2xl font-bold text-[#A4FEB7] mb-2">
          Set a new password
        </h2>
        <p className="text-sm mb-6">
          Create a new password. Ensure it differs from previous ones for security.
        </p>

        <div className="space-y-4">
          <label htmlFor="password" className="text-sm">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-md text-white ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label htmlFor="confirm-password" className="text-sm">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-3 rounded-md text-white ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        {message && <p className="text-green-400 text-sm mt-4">{message}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-[#A4FEB7] hover:bg-green-100 text-black py-3 rounded-full font-semibold transition"
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default NewPasswordPage;
