"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";

export default function AdminLoginPage() {
  // Logic Block 1: React State for the form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Logic Block 2: Wire up the Custom Credentials Form
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    
    // Trigger NextAuth's credentials provider
    await signIn("credentials", {
      email: email,
      password: password,
      callbackUrl: "/admin", // Where to redirect upon success
    });
  };

  // Logic Block 3: Wire up the Google Button
  const handleGoogleLogin = () => {
    // Trigger NextAuth's Google provider
    signIn("google", { callbackUrl: "/admin" });
  };

  return (
    // Main Container Layout (Centered on screen)
    <div className="flex h-screen items-center justify-center bg-gray-50">
      
      {/* Login Card Container */}
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Portal Access</h1>
        
        {/* Google OAuth Layout Block */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg mb-6 transition-colors"
        >
          Sign in with Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-sm text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Credentials Form Layout Block */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sendiee.com" 
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gray-900 hover:bg-black text-white font-medium p-3 rounded-lg mt-2 transition-colors"
          >
            Sign in with Email
          </button>
        </form>

      </div>
    </div>
  );
}