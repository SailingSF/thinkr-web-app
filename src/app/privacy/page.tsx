import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-8 py-16 flex-grow">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        {/* Content will be added later */}
      </main>

      <Footer />
    </div>
  );
} 