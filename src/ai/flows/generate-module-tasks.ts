
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const GenerateModuleTasksInputSchema = z.object({
  moduleContent: z.string().describe('The text content of the syllabus module to generate tasks and applications for.'),
  moduleTitle: z.string().describe('The title of the syllabus module.'),
});
export type GenerateModuleTasksInput = z.infer<typeof GenerateModuleTasksInputSchema>;

const GenerateModuleTasksOutputSchema = z.object({
  introductoryMessage: z.string().describe(
    "A welcoming, introductory message including module title, overview, 2-4 learning tasks, and 2-3 real-world applications (markdown formatted)."
  ),
  calibrateQuestions: z.array(z.string()).describe("2-3 questions to gauge learner's level and goals."),
  plan: z.array(z.string()).describe("A short plan (3-5 steps) for approaching the module."),
  teachingExplanation: z.string().describe("A brief explanation of the core ideas."),
  guidingQuestion: z.string().describe("An open-ended guiding question after the teaching explanation."),
  practiceProblem: z.string().describe("One practice problem for the learner (do not provide solution yet)."),
  checkAnswer: z.string().describe("Solution reasoning and a common misconception tip (only show after learner attempts)."),
  reflectPrompt: z.string().describe("Prompt asking learner to restate the idea in their own words."),
});
export type GenerateModuleTasksOutput = z.infer<typeof GenerateModuleTasksOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateModuleTasksPrompt',
  input: { schema: GenerateModuleTasksInputSchema },
  output: { schema: GenerateModuleTasksOutputSchema },
  prompt: `
You are a patient tutor AI for online learners.
Your behavior MUST follow these strict guidelines throughout the entire interaction:

SYSTEM BEHAVIOR:
-- Always act as a patient, friendly tutor.
-- Follow this teaching protocol step-by-step: CALIBRATE → PLAN → TEACH → PRACTICE → CHECK → REFLECT.
-- Use the module content and title provided as your single source of truth.
-- Never ask the learner to provide syllabus content again.
-- Always ground your explanations, tasks, and questions in the given module content.
-- Be encouraging, clear, and concise.
-- Format lists using markdown.
-- Output your entire response as a JSON object strictly matching the schema.

TASK:
Strictly generate the following JSON object with these fields:

1. introductoryMessage: Friendly greeting, state the module title, brief overview, 2–4 learning tasks, 2–3 real-world applications (all in well-formatted markdown).
2. calibrateQuestions: 2–3 questions to gauge learner’s background and goal for the module.
3. plan: List a short plan (3–5 steps) for approaching the module.
4. teachingExplanation: Brief, beginner-friendly explanation.
5. guidingQuestion: An open-ended, thought-stimulating question.
6. practiceProblem: One relevant practice problem (do NOT provide the answer yet).
7. checkAnswer: Solution and reasoning for the problem, plus one misconception tip (should only be shown after the learner responds, but always include in the JSON).
8. reflectPrompt: Encourage the learner to summarize the core idea in their words.

Module Title:
"{{{moduleTitle}}}"

Module Content:
"{{{moduleContent}}}"

Remember: Output must be a single valid JSON object matching the schema exactly, with no extra text or explanation.
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
