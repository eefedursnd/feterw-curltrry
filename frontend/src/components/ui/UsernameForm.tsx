'use client';

import { useState } from 'react';

export default function UsernameForm() {
  const handleSubmit = () => {
    const username = document.getElementById('username-input') as HTMLInputElement;
    if (username && username.value.trim()) {
      window.location.href = `/register?claim=${encodeURIComponent(username.value.trim())}`;
    } else {
      window.location.href = '/register';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900/50 backdrop-blur-md rounded-lg border border-zinc-800/80 p-1.5 flex animate-fade-in-up animation-delay-300 mb-5 shadow-sm shadow-purple-900/10">
      <div className="flex items-center px-3 text-zinc-400 font-medium">
        cutz.lol/
      </div>
      <input
        type="text"
        id="username-input"
        placeholder="username"
        className="flex-grow bg-transparent border-0 outline-none text-white p-2 placeholder-zinc-500 focus:placeholder-zinc-600"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-md transition-colors"
      >
        Claim
      </button>
    </div>
  );
}