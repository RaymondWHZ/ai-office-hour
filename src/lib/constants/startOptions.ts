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
    title: "✍ Dive In and Solve",
    description: "Start answering questions directly",
    prompt:
      "I'd like to start by trying questions out directly. Break down complex problems into smaller checkpoints and guide me through solving them.",
  },
];
