import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
    container: {
        borderStyle: 'solid',
        flex: 1,
    },
    closeButton: {
        top: 10,
        left: 10,
        padding: 10,
        zIndex: 100
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