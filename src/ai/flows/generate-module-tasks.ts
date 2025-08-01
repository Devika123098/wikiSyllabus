// frontend/src/ai/flows/generate-module-tasks.ts
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview An AI agent that generates learning tasks and real-world applications for a given module content.
 *
 * - generateModuleTasks - A function that handles the task and application generation process.
 * - GenerateModuleTasksInput - The input type for the generateModuleTasks function.
 * - GenerateModuleTasksOutput - The return type for the generateModuleTasks function.
 */


const GenerateModuleTasksInputSchema = z.object({
  moduleContent: z
    .string()
    .describe('The text content of the syllabus module to generate tasks and applications for.'),
  moduleTitle: z
    .string()
    .describe('The title of the syllabus module.'),
});
export type GenerateModuleTasksInput = z.infer<typeof GenerateModuleTasksInputSchema>;

const GenerateModuleTasksOutputSchema = z.object({
  introductoryMessage: z.string().describe("A welcoming, introductory message that includes the module title and a brief overview of what the user can expect, including learning tasks and real-world applications."),
});
export type GenerateModuleTasksOutput = z.infer<typeof GenerateModuleTasksOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateModuleTasksPrompt',
  input: { schema: GenerateModuleTasksInputSchema },
  output: { schema: GenerateModuleTasksOutputSchema },
  prompt: `You are an expert curriculum assistant. Your task is to generate a welcoming, introductory message for a student about a specific syllabus module. This message should also include 2-4 distinct learning tasks and 2-3 real-world applications based on the provided content.

Syllabus Module Title:
"{{{moduleTitle}}}"

Syllabus Module Content:
"{{{moduleContent}}}"

Guidelines:
1.  Start with a friendly greeting.
2.  Clearly state the module title in your response.
3.  Generate a section with 2 to 4 distinct learning tasks. Use markdown lists.
4.  Generate a section describing 2 to 3 real-world applications of the module's concepts. Use markdown lists.
5.  Combine all of this into a single, cohesive "introductoryMessage" field.
6.  Ensure the output is in the specified JSON format.
`,
});


const generateModuleTasksFlow = ai.defineFlow(
  {
    name: 'generateModuleTasks',
    inputSchema: GenerateModuleTasksInputSchema,
    outputSchema: GenerateModuleTasksOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate module tasks.");
    }
    return output;
  }
);


export async function generateModuleTasks(input: GenerateModuleTasksInput): Promise<GenerateModuleTasksOutput> {
    return generateModuleTasksFlow(input);
}
