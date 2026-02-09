import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="relative w-full ">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/img_back.png" // Place your image in public folder
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
        {/* Optional Gradient Overlay */}
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-screen px-6 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Your All-In-One Fitness And <br />
            <span className="inline-block mt-2">
              <span className="bg-green-300 text-black px-2 py-1 rounded-md">
                Wellness
              </span>{' '}
              Companion
            </span>
          </h1>
          <p className="text-gray-300 mb-8 max-w-md">
            VitaPulse is your ultimate partner in health and wellness,
            offering tailored workouts, diet tracking, sleep and heart
            monitoring, and daily hydration reminders.
          </p>
          <div className="flex gap-4">
            <button className="bg-[#A4FEB7]  text-black font-bold px-5 py-2 rounded-full hover:bg-gray-100">
              <Link href="/signin" >Sign In</Link> 
            </button>
            <button className="bg-transparent border border-white text-white font-medium px-5 py-2 rounded-full hover:bg-white hover:text-black transition">
              <Link href="/signup" >Sign Up</Link> 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
