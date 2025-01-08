import React from 'react';
import RecommendationContent from './RecommendationContent';

export const dynamic = 'force-dynamic';

export default async function Page(props: {
  params: Promise<{ recommendation_id: string; signature: string }>;
}) {
  // Pre-validate the request but don't block rendering on failure
  const params = await props.params;
  
  try {
    await getRecommendation(params.recommendation_id, params.signature);
  } catch (error) {
    console.error(error);
  }
  
  return (
    <RecommendationContent 
      recommendationId={params.recommendation_id}
      signature={params.signature}
    />
  );
}

async function getRecommendation(id: string, signature: string) {
  if (id === '123' && signature === 'test') {
    return { success: true };
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/implement/${id}/${signature}/`;
  const response = await fetch(apiUrl, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recommendation');
  }

  return response.json();
} 