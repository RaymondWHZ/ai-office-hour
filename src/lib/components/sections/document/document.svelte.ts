interface CommentState {
  dom?: HTMLElement;
  comment?: string;
}

export const commentState = $state<CommentState>({});

interface LatexState {
  dom?: HTMLElement;
  latex: string;
  update: (latex: string) => void;
}

export const latexState = $state<LatexState>({ latex: "", update: () => {} });
