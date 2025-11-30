interface ResponseSubmission {
  question?: string;
  answer: string;
}

interface ResponseState {
  pendingSubmission?: ResponseSubmission;
}

export const responseState = $state<ResponseState>({});
