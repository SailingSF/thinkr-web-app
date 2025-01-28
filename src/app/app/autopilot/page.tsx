'use client';

import { motion } from 'framer-motion';

export default function Autopilot() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-[#25262b] to-[#1a1b1e] font-inter">
      <div className="w-full max-w-2xl mx-auto text-center px-4">
        {/* Animated Robot Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-6 lg:mb-8"
        >
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              className="text-purple-400"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </motion.div>

        {/* Title with Gradient */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl lg:text-4xl font-bold mb-3 lg:mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Shopify Store Autopilot
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg lg:text-xl text-gray-400 mb-6 lg:mb-8"
        >
          Coming soon for premium users
        </motion.p>

        {/* Decorative Elements */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />
          <div className="relative bg-[#2c2d32] border border-purple-400/20 rounded-xl p-4 lg:p-8">
            <div className="grid grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1.5 lg:h-2 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full"
                />
              ))}
            </div>
            <p className="text-sm lg:text-base text-gray-400">
              Experience the future of automated store management
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 