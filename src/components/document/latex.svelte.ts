interface LatexState {
  dom?: HTMLElement;
  latex?: string;
}

export const latexState = $state<LatexState>({});
