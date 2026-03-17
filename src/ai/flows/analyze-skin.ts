'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing skin conditions from images and suggesting treatments.
 *
 * The flow uses Gemini 2.5 Flash to identify skin issues and recommends treatments based on training materials.
 * It strictly enforces human-only analysis.
 *
 * @interface AnalyzeSkinInput - Defines the input schema (base64 image and training materials).
 * @interface AnalyzeSkinOutput - Defines the output schema (diagnosis, recommendations, and human-validation flag).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeSkinInputSchema = z.object({
    imageBase64: z.string().describe('The base64 encoded string of the skin image.'),
    trainingData: z.array(
        z.object({
            title: z.string(),
            content: z.string(),
        })
    ).describe('A list of training materials describing different skin conditions and their treatments.'),
});

export type AnalyzeSkinInput = z.infer<typeof AnalyzeSkinInputSchema>;

const AnalyzeSkinOutputSchema = z.object({
    isHumanSkin: z.boolean().describe('Whether the image contains human skin or a human face suitable for dermatological analysis.'),
    diagnosis: z.string().describe('The AI diagnosis of the skin condition, or a message explaining why analysis cannot be performed if isHumanSkin is false.'),
    recommendations: z.array(
        z.object({
            productName: z.string().describe('The name of the recommended treatment or product.'),
            reason: z.string().describe('The reason why this treatment is recommended based on the training data.'),
        })
    ).describe('A list of recommended treatments with explanations. Empty if isHumanSkin is false.'),
});

export type AnalyzeSkinOutput = z.infer<typeof AnalyzeSkinOutputSchema>;

export async function analyzeSkin(input: AnalyzeSkinInput): Promise<AnalyzeSkinOutput> {
    return analyzeSkinFlow(input);
}

export const analyzeSkinFlow = ai.defineFlow(
    {
        name: 'analyzeSkinFlow',
        inputSchema: AnalyzeSkinInputSchema,
        outputSchema: AnalyzeSkinOutputSchema,
    },
    async (input) => {
        const trainingContext = input.trainingData
            .map((t) => `### ${t.title}\n${t.content}`)
            .join('\n\n');

        const result = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: [
                {
                    media: {
                        url: `data:image/jpeg;base64,${input.imageBase64}`,
                        contentType: 'image/jpeg',
                    },
                },
                {
                    text: `You are an expert dermatologist at Skin Smith Clinic. 
          
      CRITICAL INSTRUCTION: Analyze the provided image ONLY if it contains human skin or a human face. 
      If the image contains non-human subjects (e.g., cars, animals, buildings, generic objects) or if no skin is visible for analysis:
      - Set "isHumanSkin" to false.
      - Set "diagnosis" to "Analysis for this image is not possible. Please provide a clear photo of human skin for a dermatological consultation."
      - Return an empty list for "recommendations".

      If the image contains human skin:
      1. Set "isHumanSkin" to true.
      2. Identify potential skin issues (e.g., acne, hyperpigmentation, dryness, fine lines).
      3. Provide a brief, professional diagnosis.
      4. Based on our clinical training materials provided below, suggest the most suitable treatments or protocols.
      
      Training Materials:
      ${trainingContext}
      
      Output your response as JSON matching the schema provided.`,
                },
            ],
            output: { schema: AnalyzeSkinOutputSchema },
        });

        const output = result.output;

        if (!output) {
            throw new Error('AI failed to generate a response.');
        }
        return output;
    }
);
