type SessionStatus = 'action-required' | 'success' | 'failure';

export interface ThreeDSSessionResponse {
    nextAction: {
        type: string;
        url?: string;
        creq?: string;
    };
    status: SessionStatus;
}

export interface ThreeDSCallbacks {
    onSuccess?: () => void;
    onFailure?: (error: Error) => void;
    onCancel?: () => void;
}