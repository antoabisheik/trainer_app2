'use client';

import React from 'react';
import { FiTool } from 'react-icons/fi';

const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FiTool className="text-2xl text-gray-400" />
    </div>
    <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
    <p className="text-gray-500 text-sm">This feature is coming soon.</p>
  </div>
);

export default PlaceholderPage;
