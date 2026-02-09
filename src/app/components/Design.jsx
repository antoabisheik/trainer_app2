import React from 'react'
import SignInForm from './SignIn'
import Image from 'next/image'
function Design() {
  return (
    <div className="min-h-screen bg-[url('/img_back.png')] bg-cover bg-center flex flex-col justify-between px-6 py-4">
      
      <div className="flex flex-row text-white text-2xl font-bold">
      <Image width={40} height={40} src="/logo.png" alt='logo' /> 
        <h2 className='text-[#A4FEB7] px-1 text-xl my-1'>Smartan Fittech</h2> 
      </div>

      <div className="flex-grow">
        <SignInForm />
      </div>

      <div className="text-white text-sm text-center">
        © 2025 Your Company. All rights reserved.
      </div>

    </div>
  )
}

export default Design
