import React from 'react';
import RecommendationContent from './RecommendationContent';

type PageProps = {
  params: {
    recommendation_id: string;
    signature: string;
  }
}

export default async function Page({ params }: PageProps) {
  const { recommendation_id, signature } = await params;
  
  return (
    <RecommendationContent 
      recommendationId={recommendation_id}
      signature={signature}
    />
  );
} 