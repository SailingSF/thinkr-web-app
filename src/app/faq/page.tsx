import Navigation from "@/components/Navigation";

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
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />

      {/* FAQ Content */}
      <main className="max-w-3xl mx-auto px-xl py-3xl">
        <h1 className="text-4xl font-bold mb-xl text-center">Frequently Asked Questions</h1>
        
        <div className="space-y-xl">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#25262b] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-md text-purple-400">{faq.question}</h3>
              <p className="text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-2xl text-center">
          <p className="text-gray-400 mb-md">Still have questions?</p>
          <a 
            href="mailto:support@thinkr.com" 
            className="inline-block px-lg py-md bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
} 