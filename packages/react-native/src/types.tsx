
export interface ThreeDSCallbacks {
    onSuccess: () => void;
    onFailure: (error: Error) => void;
    onCanceled: () => void;
}

export interface ThreeDSSessionResponse {
    nextAction: {
      type: string;
      url?: string;
      creq?: string;
    };
    status: 'action-required' | 'success' | 'failure';
    failureReason?: string;
}