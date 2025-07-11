'use client';

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "What is thinkr?",
    answer: "thinkr is an AI-powered platform that helps e-commerce businesses make data-driven decisions on autopilot. It connects to your Shopify store and other platforms to provide insights and recommendations."
  },
  {
    question: "How does thinkr work?",
    answer: "thinkr connects to your existing data sources through secure integrations, analyzes your data using AI, and provides actionable insights and recommendations to improve your business performance."
  },
  {
    question: "What platforms does thinkr integrate with?",
    answer: "thinkr integrates with Shopify, Google Analytics, Google Ads, Facebook Ads, Klaviyo, Gorgias, Pinterest Ads, and more. We're constantly adding new integrations."
  },
  {
    question: "What is the 'Ask' feature?",
    answer: "The 'Ask' feature allows you to chat directly with your store and its data. You can ask questions in plain English, like 'What were my total sales last week?' or 'Which products are selling the most?', and get immediate, data-driven answers from your connected platforms."
  },
  {
    question: "How does the 'Research' feature work?",
    answer: "'Research' lets you delegate in-depth research tasks to an AI agent. You can ask the agent to investigate a topic, and it will analyze your store's data, search the web for relevant information, and compile a detailed report that is then emailed to you. It's perfect for complex questions that require comprehensive analysis."
  },
  {
    question: "What are 'Agents' and how do they help my business?",
    answer: "'Agents' are autonomous AI assistants you create to work for your business 24/7. There are two types: Growth Agents and Alert Agents. Growth Agents proactively monitor your data to identify growth opportunities and email you actionable insights. Alert Agents watch for specific changes or anomalies in your data, sending you intelligent alerts so you can react quickly to important events."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take data security seriously. All data is credentials are encrypted and data is helled completely separately from other users and platforms, and we follow industry best practices for data protection and privacy."
  },
  {
    question: "How much does thinkr cost?",
    answer: "thinkr starts at free! Our paid plans that allow much more interaction start from $25/month. You can manage your plan right from the Shopify admin page with thinkr installed.Visit our pricing page for detailed information about our plans and features."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees."
  }
];

interface FaqItemProps {
  faq: { question: string; answer: string };
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ faq, index, isOpen, onToggle }) => (
  <div className="border-b border-gray-700/50 last:border-b-0">
    <button
      onClick={() => onToggle(index)}
      className="flex w-full items-center justify-between py-5 text-left text-lg font-medium text-white focus:outline-none"
    >
      <span>{faq.question}</span>
      <ChevronDownIcon
        className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#8B5CF6]' : 'text-gray-400'}`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: 'auto', y: 0 },
            collapsed: { opacity: 0, height: 0, y: -10 },
          }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
          <p className="pb-5 pr-6 text-base text-gray-300">
            {faq.answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);


export default function FAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#141718] text-white flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-xl text-gray-400">
              Your questions, answered. Everything you need to know about thinkr.
            </p>
          </div>
          
          <div className="divide-y divide-gray-700/50 rounded-2xl bg-[#1D1D1F]/60 p-4 sm:p-6 lg:p-8">
            {faqs.map((faq, index) => (
              <FaqItem 
                key={index}
                index={index}
                faq={faq}
                isOpen={openFaqIndex === index}
                onToggle={toggleFaq}
              />
            ))}
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#5A2CDE] p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Still have questions?</h2>
            <p className="mt-2 text-lg text-purple-100">Our support team is here to help.</p>
            <a 
              href="mailto:support@thinkr.com" 
              className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-medium text-[#8B5CF6] transition hover:bg-gray-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 