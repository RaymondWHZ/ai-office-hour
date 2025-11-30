interface CommentState {
  dom?: HTMLElement;
  comment?: string;
}

export const commentState = $state<CommentState>({});
