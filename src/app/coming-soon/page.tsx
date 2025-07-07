import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { redirect } from 'next/navigation';

// Whitelist of allowed feature names
const ALLOWED_FEATURES = [
  "Analytics",
  "Dashboard", 
  "Reports",
  "Integrations",
  "Implementation"
] as const;

type FeatureName = typeof ALLOWED_FEATURES[number];

function isValidFeature(feature: unknown): feature is FeatureName {
  return typeof feature === 'string' && ALLOWED_FEATURES.includes(feature as FeatureName);
}

type Props = {
  params: Promise<Record<string, never>>
  searchParams: Promise<{ feature?: string }>
}

export default async function Page({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  if (!resolvedParams) return null;
  
  const { feature } = resolvedParams;
  
  if (feature && !isValidFeature(feature)) {
    redirect('/coming-soon');
  }

  const featureName = feature || "Feature";
  
  return (
    <div className="min-h-screen bg-[#141718] text-white flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              {featureName} Coming Soon!
            </h1>
            <p className="text-xl text-[#8C74FF] font-normal">
              We're working hard to bring you this exciting new feature.
            </p>
            <p className="text-gray-400 text-lg">
              Stay tuned for updates and be the first to experience the future of e-commerce automation with thinkr.
            </p>
          </div>
          
          <div className="bg-[#2C2C2E] p-8 rounded-2xl">
            <h3 className="text-xl font-medium text-[#8B5CF6] mb-4">
              Get Notified When It's Ready
            </h3>
            <p className="text-gray-300 mb-6">
              Join our waiting list to be notified as soon as this feature becomes available.
            </p>
            <a 
              href="mailto:updates@thinkr.com?subject=Notify me about new features"
              className="inline-block px-6 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium rounded-xl transition-colors"
            >
              Join Waiting List
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              In the meantime, explore our existing features and see how thinkr can help your business grow.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 