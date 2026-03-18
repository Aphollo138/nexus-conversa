import React, { useEffect, useRef, useState } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';

interface OptimizedSplineProps {
  scene: string;
  className?: string;
}

export default function OptimizedSpline({ scene, className }: OptimizedSplineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineAppRef = useRef<Application | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !hasLoaded) {
          setHasLoaded(true);
        }
      },
      {
        rootMargin: '200px', // Load slightly before it comes into view
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasLoaded]);

  // Pause/Play based on visibility
  useEffect(() => {
    if (splineAppRef.current) {
      if (isVisible) {
        splineAppRef.current.play();
      } else {
        splineAppRef.current.stop();
      }
    }
  }, [isVisible]);

  const onLoad = (splineApp: Application) => {
    splineAppRef.current = splineApp;
    if (!isVisible) {
      splineApp.stop();
    }
  };

  return (
    <div ref={containerRef} className={`w-full h-full ${className || ''}`}>
      {hasLoaded && (
        <Spline scene={scene} className="w-full h-full" onLoad={onLoad} />
      )}
    </div>
  );
}
