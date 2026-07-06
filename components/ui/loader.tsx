'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Compass, Plane, MapPin, Sparkles } from 'lucide-react';

type LoadingOverlayProps = {
  message?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'travel' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
};

export default function LoadingOverlay({
  message = 'Loading...',
  fullScreen = true,
  variant = 'travel',
  size = 'md',
  showLogo = true,
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  // Travel messages
  const travelMessages = [
    'Packing your bags... ✈️',
    'Plotting the course... 🗺️',
    'Checking the weather... 🌤️',
    'Finding the best routes... 🚗',
    'Booking experiences... 🏨',
    'Preparing your itinerary... 📋',
    'Almost there... 🌅',
  ];

  // Size configurations
  const sizes = {
    sm: {
      spinner: 'w-6 h-6',
      text: 'text-sm',
      logo: 'w-12 h-12',
      padding: 'p-2',
      gap: 'gap-2',
    },
    md: {
      spinner: 'w-10 h-10',
      text: 'text-base',
      logo: 'w-16 h-16',
      padding: 'p-3',
      gap: 'gap-3',
    },
    lg: {
      spinner: 'w-14 h-14',
      text: 'text-lg',
      logo: 'w-20 h-20',
      padding: 'p-4',
      gap: 'gap-4',
    },
  };

  useEffect(() => {
    // Rotate travel messages
    if (variant === 'travel') {
      let index = 0;
      const interval = setInterval(() => {
        setCurrentMessage(travelMessages[index % travelMessages.length]);
        index++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [variant]);

  useEffect(() => {
    // Animate progress bar
    if (variant === 'travel') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [variant]);

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center'
    : 'relative z-10 flex items-center justify-center min-h-[200px]';

  // Default loading variant
  if (variant === 'default') {
    return (
      <div className={`${containerClass} bg-white/95 backdrop-blur-sm`}>
        <div className="text-center max-w-sm mx-auto px-4">
          {showLogo && (
            <div className="mb-4 flex justify-center">
              <div className={`${sizes[size].logo} rounded-full bg-primary/10 flex items-center justify-center`}>
                <Compass className={`${sizes[size].logo} p-2 text-primary`} />
              </div>
            </div>
          )}
          <div className="flex justify-center mb-4">
            <Loader2 className={`${sizes[size].spinner} animate-spin text-primary`} />
          </div>
          <p className={`${sizes[size].text} font-medium text-slate-700`}>{message}</p>
        </div>
      </div>
    );
  }

  // Minimal loading variant
  if (variant === 'minimal') {
    return (
      <div className={`${containerClass} bg-white/50 backdrop-blur-sm`}>
        <div className="text-center px-4">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse">
                <div className="w-full h-full rounded-full bg-primary/10" />
              </div>
              <Loader2 className={`${sizes[size].spinner} animate-spin text-primary`} />
            </div>
          </div>
          <p className={`${sizes[size].text} text-slate-600`}>{message}</p>
        </div>
      </div>
    );
  }

  // Travel variant (default)
  return (
    <div className={`${containerClass} bg-[#f7fbff] overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-bounce [animation-duration:3s]">
          <Plane className="w-12 h-12 rotate-45 text-primary/10" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 animate-bounce [animation-duration:3.5s] [animation-delay:0.5s]">
          <MapPin className="w-16 h-16 text-primary/10" />
        </div>
        <div className="absolute top-1/3 right-1/3 animate-pulse [animation-duration:2s]">
          <Sparkles className="w-8 h-8 text-primary/10" />
        </div>
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative max-w-md w-full mx-4 text-center">
        {showLogo && (
          <div className="mb-6 flex justify-center">
            <div className={`${sizes[size].logo} rounded-full bg-white shadow-lg flex items-center justify-center ${sizes[size].padding} border-2 border-primary/20`}>
              <Compass className="w-full h-full text-primary" />
            </div>
          </div>
        )}

        {showLogo && (
          <h2 className="text-2xl font-bold text-slate-900 mb-2">TravelMate AI</h2>
        )}

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Compass className={`${sizes[size].spinner} text-primary/20`} />
            </div>
            <Loader2 className={`${sizes[size].spinner} animate-spin text-primary`} />
          </div>
        </div>

        <p className={`${sizes[size].text} font-medium text-slate-600 transition-all duration-500`}>
          {currentMessage}
        </p>

        <div className="mt-4 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300 ease-out bg-primary"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-400">
          {Math.round(Math.min(progress, 95))}%
        </p>
      </div>
    </div>
  );
}