import { StyleSheet } from 'react-native';

const defaultModalStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "100%",
        height: "95%",
        backgroundColor: "#fff",
        padding: 0,
        justifyContent: "flex-start",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20, 
    },
    titleBar: {
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        position: "relative",
        width: "100%",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    titleText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    closeButton: {
        position: "absolute",
        left: 10,
        padding: 10,
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "black",
    },
});

const defaultThreeDSecureFrameStyles = StyleSheet.create({
  threeDSFrame: {
    flex: 1,
    backgroundColor: "plum"
  },
  spinnerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export {
    defaultModalStyles,
    defaultThreeDSecureFrameStyles
}