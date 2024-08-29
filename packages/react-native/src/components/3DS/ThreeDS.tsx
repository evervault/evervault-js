import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { getThreeDSSession } from './utilities';
import { WebView } from 'react-native-webview';
import { useEvervault } from '../EvervaultProvider';
import { ThreeDSCallbacks } from './types';

export interface ThreeDSStyles {
    containerStyle?: StyleProp<ViewStyle>;
    closeButtonStyle?: StyleProp<ViewStyle>;
    closeButtonTextStyle?: StyleProp<TextStyle>;
    titleBarStyle?: StyleProp<ViewStyle>;
    titleTextStyle?: StyleProp<TextStyle>;
    webviewWrapperStyle?: StyleProp<ViewStyle>;
}

export interface ThreeDSConfig {
    titleBarText?: string;
    dismissButtonLabel?: string;
    pollingInterval?: number; 
}

export interface ThreeDSProps {
    sessionId: string;
    callbacks: ThreeDSCallbacks;
    config?: ThreeDSConfig;
    styles?: ThreeDSStyles;
}

function validateThreeDSConfig(config: ThreeDSConfig | undefined) {
    if (config?.pollingInterval && config.pollingInterval <= 2000) {
        throw new Error("pollingInterval must be greater than 2000 milliseconds.");
    }
    return config;
}

const THREE_D_S_CHALLENGE_DOMAIN = 'c713-2a09-bac5-3a69-ebe-00-178-198.ngrok-free.app'; // Replace with your actual domain

export function ThreeDS({ sessionId, callbacks, config, styles}: ThreeDSProps) {
    const [isActionRequired, setIsActionRequired] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const ev = useEvervault();
    const team = ev?.teamUuid;
    const app = ev?.appUuid;

    if (!team || !app) {
        throw new Error('Missing Evervault Team or App Uuid. Make sure the 3DS component is nested within the Evervault Provider');
    }

    validateThreeDSConfig(config); 

    const startThreeDS = () => {
        setIsActionRequired(true);
    };

    const closeThreeDS = () => {
        setIsActionRequired(false);
        console.log('Closing 3DS session');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            setIsPolling(false);
        }
    };

    const cancelThreeDS = () => {
        closeThreeDS();
        //TODO: Patch session status to cancelled
        callbacks.onCancel?.();
    };

    useEffect(() => {
        const checkForActionRequired = async () => {
            console.log(`https://${THREE_D_S_CHALLENGE_DOMAIN}/?session=${sessionId}&app=${app}&team=${team}`);
            console.log(`https://${THREE_D_S_CHALLENGE_DOMAIN}/?session=${sessionId}&app=${app}&team=${team}`);
            console.log(`https://${THREE_D_S_CHALLENGE_DOMAIN}/?session=${sessionId}&app=${app}&team=${team}`);
            try {
                const session = await getThreeDSSession(sessionId, app);

                if (session.status === 'action-required') {
                    startThreeDS();
                } else if (session.status === 'success') {
                    callbacks.onSuccess?.();
                    closeThreeDS();
                } else {
                    callbacks.onFailure?.(new Error('3DS session failed'));
                    closeThreeDS();
                }
            } catch (error) {
                callbacks.onFailure?.(new Error('Error checking 3DS session status: ' + (error as Error).message));
                closeThreeDS();
            }
        };

        checkForActionRequired();
        return () => closeThreeDS();
    }, [sessionId]);

    useEffect(() => {
        if (isActionRequired && !isPolling) {
            setIsPolling(true);

            intervalRef.current = setInterval(async () => {
                let attempts = 0;
                try {
                    attempts++;
                    const session = await getThreeDSSession(sessionId, app);

                    if (session.status !== 'action-required') {
                        clearInterval(intervalRef.current as NodeJS.Timeout);
                        setIsPolling(false);
                        switch (session.status) {
                            case 'success':
                                callbacks.onSuccess?.();
                                break;
                            case 'failure':
                                callbacks.onFailure?.(new Error('3DS session failed'));
                                break;
                            default:
                                break;
                        }
                        closeThreeDS();
                    }

                } catch (error) {
                    console.error('Error while polling 3DS session status:', error);
                    if (attempts > 5) {
                        callbacks.onFailure && callbacks.onFailure(new Error('Unable to retrieve 3DS session status'));
                        closeThreeDS();
                    }
                }
            }, config?.pollingInterval || 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                setIsPolling(false);
            }
        };
    }, [isActionRequired, sessionId]);

    return (
        isActionRequired ? (
            <View style={[defaultStyles.container, styles?.containerStyle]}>
                <View style={[defaultStyles.titleBar, styles?.titleBarStyle]}>
                    <TouchableOpacity style={[defaultStyles.closeButton, styles?.closeButtonStyle]} onPress={cancelThreeDS}>
                        <Text style={[defaultStyles.closeButtonText, styles?.closeButtonTextStyle]}> {config?.dismissButtonLabel ? config.dismissButtonLabel : 'X'}</Text>
                    </TouchableOpacity>
                    <Text style={[defaultStyles.titleText, styles?.titleTextStyle]}>
                        {config?.titleBarText ? config.titleBarText : "Verification"}
                    </Text>
                </View>
                <View style={[defaultStyles.webviewWrapper, styles?.webviewWrapperStyle]}>
                    <WebView
                        source={{
                            uri: `https://${THREE_D_S_CHALLENGE_DOMAIN}/?session=${sessionId}&app=${app}&team=${team}`
                        }}
                    />
                </View>
            </View>
        ) : null
    );
}

const defaultStyles = StyleSheet.create({
    container: {
        borderStyle: 'solid',
        flex: 1,
    },
    titleBar: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        position: 'relative',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        left: 10,
        padding: 10,
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
    },
    webviewWrapper: {
        flex: 1,
    },
});