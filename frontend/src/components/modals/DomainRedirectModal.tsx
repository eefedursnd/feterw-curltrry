'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function DomainRedirectModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectFrom = urlParams.get('redirect_from');
    
    if (redirectFrom === 'lyra.rip' && !sessionStorage.getItem('redirectNoticeShown')) {
      setIsOpen(true);
      sessionStorage.setItem('redirectNoticeShown', 'true');
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('redirect_from');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
        
        <button 
          onClick={closeModal}
          className="absolute top-3 right-3 p-1 rounded-full text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
                <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white text-center mb-2">We've Changed Our Name!</h3>
          
          <p className="text-white/80 text-center mb-4">
            lyra.rip is now haze.bio.
          </p>
          
          <p className="text-white/70 text-sm text-center mb-6">
            Please update your bookmarks and use <span className="text-purple-400 font-medium">haze.bio</span> from now on. 
            The old domain will continue to work, but it's better to use our new domain.
          </p>
          
          <div className="flex justify-center">
            <button 
              onClick={closeModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}