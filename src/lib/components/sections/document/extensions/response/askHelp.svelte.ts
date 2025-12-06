interface AskHelpState {
  pending?: {
    question: string;
    currentAnswer: string;
  };
}

export const askHelpState = $state<AskHelpState>({});
