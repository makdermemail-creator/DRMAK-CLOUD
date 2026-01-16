'use server';

import { generateProductDiscountRecommendations } from '@/ai/flows/generate-product-discount-recommendations';
import type { GenerateProductDiscountRecommendationsInput } from '@/ai/flows/generate-product-discount-recommendations';

export async function getDiscountRecommendations(
  input: GenerateProductDiscountRecommendationsInput
) {
  try {
    const recommendations = await generateProductDiscountRecommendations(input);
    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error getting discount recommendations:', error);
    return { success: false, error: 'Failed to generate recommendations.' };
  }
}
