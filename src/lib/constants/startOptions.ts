export interface StartOption {
  title: string;
  description: string;
  prompt: string;
}

export const START_OPTIONS: StartOption[] = [
  {
    title: "👨‍🏫 Walkthrough",
    description: "Guided explanation of concepts",
    prompt:
      "I'd like a walkthrough of the document. Please guide me through the key concepts and help me understand what I need to learn step by step.",
  },
  {
    title: "✍ Quiz Style",
    description: "Test knowledge with questions",
    prompt:
      "I'd like to test my understanding with quiz-style questions. Please assess what I know and help me practice the concepts in this document.",
  },
];
