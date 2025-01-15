'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const images = [
  '/homepage/homepage_01.jpg',
  '/homepage/homepage_02.jpg',
  '/homepage/homepage_03.jpg',
];

export default function RotatingBackground() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Rotate image every 3 hours (10800000 milliseconds)
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 10800000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`Homepage Background ${index + 1}`}
          fill
          className={`object-cover transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          priority={index === 0}
        />
      ))}
    </div>
  );
} 