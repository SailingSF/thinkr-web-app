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

// Type guard to check if a string is a valid feature name
function isValidFeature(feature: string | undefined): feature is FeatureName {
  return typeof feature === 'string' && ALLOWED_FEATURES.includes(feature as FeatureName);
}

export default function ComingSoon({
  searchParams,
}: {
  searchParams: { feature?: string };
}) {
  // Redirect to base URL if invalid feature is provided
  if (searchParams.feature && !isValidFeature(searchParams.feature)) {
    redirect('/coming-soon');
  }

  const featureName = searchParams.feature || "New";
  
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-8 py-16 flex-grow">
        <h1 className="text-4xl font-bold mb-8">{featureName} Feature Coming Soon!</h1>
      </main>

      <Footer />
    </div>
  );
} 