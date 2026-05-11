import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // 2 seconds total for 100 steps

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 800); // Wait for fade out animation
      }, 500);
    }
  }, [progress, onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0f14] transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col items-center max-w-[300px] w-full px-6">
        {/* Logo Text */}
        <h1 className="text-white text-2xl font-bold tracking-[0.2em] mb-4 uppercase">
          PRICEFLOW<span className="text-[#3b82f6]">.</span>AI
        </h1>
        
        {/* Progress Bar Container */}
        <div className="w-full h-[3px] bg-[#1e2330] rounded-full overflow-hidden relative">
          {/* Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#10b981] via-[#3b82f6] to-[#8b5cf6] transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
