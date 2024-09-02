import { ThreeDSSession, ThreeDSSessionResponse } from './types';
import { EV_API_DOMAIN } from './config';

export function threeDSSession(sessionId: string, appId: string): ThreeDSSession {
    const get = async (): Promise<ThreeDSSessionResponse> => {
        try {
            const response = await fetch(
                `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/${sessionId}`,
                {
                    headers: {
                        'x-evervault-app-id': appId,
                    },
                }
            );

            const result = await response.json() as ThreeDSSessionResponse;
            return result;
        } catch (error) {
            console.error('Error fetching 3DS session status', error);
            throw error;
        }
    };

    const cancel = async (): Promise<void> => {
        try {
            console.log('Cancelling 3DS session in EV API');
            await fetch(
                `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/${sessionId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-evervault-app-id': appId,
                    },
                    body: JSON.stringify({ outcome: 'cancelled' }),
                }
            );
        } catch (error) {
            console.error('Error cancelling 3DS session', error);
            throw error;
        }
    };

    return {
        sessionId,
        get,
        cancel,
    } as ThreeDSSession;
}

export default ThreeDSSession;