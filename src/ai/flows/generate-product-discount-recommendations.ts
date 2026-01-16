'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating product discount recommendations based on pharmacy data.
 *
 * The flow analyzes product information, including quantity and expiry date, to suggest products that should be marked for discounts.
 *
 * @interface GenerateProductDiscountRecommendationsInput - Defines the input schema for the flow.
 * @interface GenerateProductDiscountRecommendationsOutput - Defines the output schema for the flow.
 * @function generateProductDiscountRecommendations - The main function that triggers the flow and returns discount recommendations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDiscountRecommendationsInputSchema = z.object({
  products: z.array(
    z.object({
      productName: z.string().describe('The name of the product.'),
      category: z.string().describe('The category of the product.'),
      supplier: z.string().describe('The supplier of the product.'),
      purchasePrice: z.number().describe('The purchase price of the product.'),
      sellingPrice: z.number().describe('The selling price of the product.'),
      quantity: z.number().describe('The current quantity in stock.'),
      expiryDate: z.string().describe('The expiry date of the product (YYYY-MM-DD).'),
    })
  ).describe('An array of product objects with details about each product.'),
});

export type GenerateProductDiscountRecommendationsInput = z.infer<
  typeof GenerateProductDiscountRecommendationsInputSchema
>;

const GenerateProductDiscountRecommendationsOutputSchema = z.object({
  recommendedProducts: z.array(
    z.object({
      productName: z.string().describe('The name of the product to discount.'),
      reason: z.string().describe('The reason for recommending a discount.'),
    })
  ).describe('An array of product names that are recommended for discounts.'),
});

export type GenerateProductDiscountRecommendationsOutput = z.infer<
  typeof GenerateProductDiscountRecommendationsOutputSchema
>;

export async function generateProductDiscountRecommendations(
  input: GenerateProductDiscountRecommendationsInput
): Promise<GenerateProductDiscountRecommendationsOutput> {
  return generateProductDiscountRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDiscountRecommendationsPrompt',
  input: {schema: GenerateProductDiscountRecommendationsInputSchema},
  output: {schema: GenerateProductDiscountRecommendationsOutputSchema},
  prompt: `You are an expert pharmacy manager at Skin Smith Clinic. Analyze the following product data and recommend products that should be marked for discounts based on their quantity, expiry date, and turnover rate. Prioritize products nearing expiry or with low stock. Explain the reason for each recommendation.

Products:
{{#each products}}
- Product Name: {{productName}}, Category: {{category}}, Supplier: {{supplier}}, Purchase Price: {{purchasePrice}}, Selling Price: {{sellingPrice}}, Quantity: {{quantity}}, Expiry Date: {{expiryDate}}
{{/each}}


Output should be in JSON format.
`,
});

const generateProductDiscountRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateProductDiscountRecommendationsFlow',
    inputSchema: GenerateProductDiscountRecommendationsInputSchema,
    outputSchema: GenerateProductDiscountRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    