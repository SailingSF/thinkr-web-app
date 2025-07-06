'use client';

import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import { useNavigation } from '@/contexts/NavigationContext';

const faqs = [
  {
    question: "What is thinkr?",
    answer: "thinkr is an AI-powered analytics platform that helps e-commerce businesses make data-driven decisions. It connects to your Shopify store and other platforms to provide insights and recommendations."
  },
  {
    question: "How does thinkr work?",
    answer: "thinkr connects to your existing data sources through secure integrations, analyzes your data using AI, and provides actionable insights and recommendations to improve your business performance."
  },
  {
    question: "What platforms does thinkr integrate with?",
    answer: "thinkr integrates with Shopify, Google Analytics, Google Ads, Meta Ads, Klaviyo, Gorgias, Pinterest Ads, and more. We're constantly adding new integrations."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take data security seriously. All data is encrypted in transit and at rest, and we follow industry best practices for data protection and privacy."
  },
  {
    question: "How much does thinkr cost?",
    answer: "thinkr offers flexible pricing plans starting from $29/month. Visit our pricing page for detailed information about our plans and features."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees."
  }
];

export default function FAQ() {
  const { isSidebarCollapsed } = useNavigation();

  return (
    <div className="h-screen bg-[#141718] overflow-hidden">
      <Navigation />
      <AppSidebar />
      
      <main className={`pt-16 p-4 h-[calc(100vh-1rem)] overflow-auto transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
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