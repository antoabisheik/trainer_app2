// app/verify-email/page.tsx or pages/verify-email.tsx
import React from "react";
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[url('/img_back.png')] bg-cover bg-center flex items-center justify-center text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-400">Verify Your Email</h2>
        <p className="mt-2">We sent a verification link to your email. Please confirm before signing in.</p>
      </div>
    </div>
  );
}
