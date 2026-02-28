'use server';

import { generateProductDiscountRecommendations } from '@/ai/flows/generate-product-discount-recommendations';
import type { GenerateProductDiscountRecommendationsInput } from '@/ai/flows/generate-product-discount-recommendations';

import { analyzeSkin } from '@/ai/flows/analyze-skin';
import type { AnalyzeSkinInput } from '@/ai/flows/analyze-skin';

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

export async function analyzeSkinAction(input: AnalyzeSkinInput) {
  try {
    const result = await analyzeSkin(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in skin analysis action:', error);
    return { success: false, error: 'Failed to analyze skin image.' };
  }
}
