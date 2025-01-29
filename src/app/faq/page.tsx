'use client';

import { useEffect, useState } from 'react';
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";

export default function FAQ() {
  const faqs = [
    {
      question: "What is thinkr?",
      answer: "thinkr is a smart operations hub that helps Shopify store owners optimize their business through advanced analytics, inventory management, and AI-powered insights."
    },
    {
      question: "How does the analytics dashboard work?",
      answer: "Our analytics dashboard provides real-time insights into your Shopify store's performance, including sales trends, customer behavior, and inventory metrics. It automatically syncs with your Shopify store to provide up-to-date information."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted both in transit and at rest, and we follow industry best practices for data protection. We never share your data with third parties without your explicit consent."
    },
    {
      question: "How does the inventory management system work?",
      answer: "Our inventory management system tracks your stock levels in real-time, predicts when you'll need to reorder based on historical data, and can even automate the reordering process based on your preferences."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We offer 24/7 email support and live chat during business hours. Our team of experts is always ready to help you optimize your store's performance and resolve any issues you might encounter."
    }
  ];

  return (
    <div className="h-screen bg-[#141718] overflow-hidden">
      <Navigation />
      <AppSidebar />
      
      <main className="lg:pl-[336px] pt-16 p-4 h-[calc(100vh-1rem)] overflow-auto">
        <div className="max-w-3xl mx-auto py-8 lg:py-12">
          <div className="flex flex-col gap-1 mb-8">
            <h1 className="text-[35px] text-[#FFFFFF] font-normal m-0">
              Frequently Asked Questions
            </h1>
            <p className="text-[25px] text-[#8C74FF] font-normal m-0">
              Get answers to common questions about thinkr.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#2C2C2E] p-6 lg:p-8 rounded-2xl">
                <h3 className="text-xl font-medium text-[#8B5CF6] mb-3">{faq.question}</h3>
                <p className="text-gray-300 text-base lg:text-lg">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <a 
              href="mailto:support@thinkr.com" 
              className="inline-block px-6 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium rounded-xl transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 