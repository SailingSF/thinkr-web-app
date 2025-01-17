'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const images = [
  '/homepage/homepage_01.jpg',
  '/homepage/homepage_02.jpg',
  '/homepage/homepage_03.jpg',
];

export default function RotatingBackground() {
  const getImageIndex = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const threeHourPeriod = Math.floor(now.getHours() / 3);
    return (dayOfYear + threeHourPeriod) % images.length;
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(getImageIndex);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImageIndex(getImageIndex()), 60000);
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