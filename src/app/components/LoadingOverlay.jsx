// components/LoadingOverlay.tsx
'use client';
import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingOverlay;
