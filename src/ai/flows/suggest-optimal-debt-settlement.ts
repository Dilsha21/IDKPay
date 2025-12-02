'use server';

/**
 * @fileOverview An AI agent that suggests an optimal debt settlement strategy.
 *
 * - suggestOptimalDebtSettlement - A function that handles the debt settlement suggestion process.
 * - SuggestOptimalDebtSettlementInput - The input type for the suggestOptimalDebtSettlement function.
 * - SuggestOptimalDebtSettlementOutput - The return type for the suggestOptimalDebtSettlement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalDebtSettlementInputSchema = z.object({
  balances: z
    .array(
      z.object({
        payerId: z.string().describe('The user ID of the payer.'),
        userId: z.string().describe('The user ID of the user who owes the payer.'),
        amount: z.number().describe('The amount owed. A positive amount indicates the userId owes the payerId.'),
      })
    )
    .describe('An array of balances between users.'),
});

export type SuggestOptimalDebtSettlementInput = z.infer<
  typeof SuggestOptimalDebtSettlementInputSchema
>;

const SuggestOptimalDebtSettlementOutputSchema = z.object({
  settlementInstructions: z
    .array(
      z.object({
        fromUserId: z.string().describe('The user ID of the user who should pay.'),
        toUserId: z.string().describe('The user ID of the user who should receive payment.'),
        amount: z.number().describe('The amount to be paid.'),
      })
    )
    .describe(
      'An array of settlement instructions, each indicating who should pay whom and how much.'
    ),
});

export type SuggestOptimalDebtSettlementOutput = z.infer<
  typeof SuggestOptimalDebtSettlementOutputSchema
>;

export async function suggestOptimalDebtSettlement(
  input: SuggestOptimalDebtSettlementInput
): Promise<SuggestOptimalDebtSettlementOutput> {
  return suggestOptimalDebtSettlementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalDebtSettlementPrompt',
  input: {schema: SuggestOptimalDebtSettlementInputSchema},
  output: {schema: SuggestOptimalDebtSettlementOutputSchema},
  prompt: `You are a financial advisor specializing in debt settlement strategies for roommates.

Given the following balances between roommates, suggest an optimal debt settlement strategy that minimizes the number of transactions required to settle all debts.

Balances:
{{#each balances}}
- {{userId}} owes {{payerId}}: Rs. {{amount}}
{{/each}}

Provide settlement instructions in the following JSON format:

{
  "settlementInstructions": [
    {
      "fromUserId": "user_id_of_payer",
      "toUserId": "user_id_of_recipient",
      "amount": amount_to_be_paid
    }
    // ... more instructions
  ]
}

Make sure the settlement instructions are clear and easy to follow. Ensure that all debts are settled.
`,
});

const suggestOptimalDebtSettlementFlow = ai.defineFlow(
  {
    name: 'suggestOptimalDebtSettlementFlow',
    inputSchema: SuggestOptimalDebtSettlementInputSchema,
    outputSchema: SuggestOptimalDebtSettlementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
