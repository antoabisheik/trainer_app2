"use client";
import Link from "next/link";
import React from "react";

const ConfirmPage = () => {
  return (
    <div className="flex flex-start top-30 flex items-center justify-center px-8 sm:px-20 bg-gradient-to-r from-[#123425] to-[#0f1c1a] text-white relative">
      
      <div className="max-w-md space-y-6">
       

        <h2 className="text-2xl text-center w-120  sm:text-3xl font-bold text-white">
          Password changed  Successfully 
          
        </h2>

        <p className="text-sm text-center text-gray-300">
          Congratulations! Your password has been changed.
          <br />
          Click continue to login.
        </p>

        <button className="bg-[#A4FEB7] mx-30 text-black px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition">
            <Link href="/signin" className="no-underline">Login In To Continue</Link>
        </button>
      </div>
    </div>
  );
};

export default ConfirmPage;
