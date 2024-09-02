import React from "react";
import { Modal, TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { ThreeDSNamespace as ThreeDS, useThreeDS } from "./context";
import { ThreeDSCallbacks } from "./types";


export interface ThreeDSModalConfig {
    titleText: string;
    closeButtonText: string;
}

export interface ThreeDSModalStyle {
    modalStyle: ViewStyle;
    modalContentStyle: ViewStyle;
    titleBarStyle: ViewStyle;
    titleTextStyle: TextStyle;
    closeButtonStyle: object;
    closeButtonTextStyle: TextStyle;
}

export interface ThreeDSModalProps {
    sessionId: string;
    callbacks: ThreeDSCallbacks;
    config?: ThreeDSModalConfig;
    style?: ThreeDSModalStyle;
}

const ThreeDSModalInternal = ({callbacks, config, style}: ThreeDSModalProps) => {
  const { session, shouldShow3DSFrame } = useThreeDS();

  const close3DS = async () => {
    await session.cancel();
    callbacks.onCancel();
  };

  if (!shouldShow3DSFrame) {
    return null;
  }

  return (
    <Modal animationType="slide" transparent={true}>
      <View style={[defaultStyles.modalContainer, style?.modalStyle]}>
        <View style={[defaultStyles.modalContent, style?.modalContentStyle]}>
          <View style={[defaultStyles.titleBar, style?.titleBarStyle]}>
            <TouchableOpacity
              style={[defaultStyles.closeButton, style?.closeButtonStyle]}
              onPress={close3DS}
            >
              <Text style={[defaultStyles.closeButtonText, style?.closeButtonTextStyle]}>
                {config?.closeButtonText || "X"}
              </Text>
            </TouchableOpacity>
            <Text style={[defaultStyles.titleText, style?.titleTextStyle]}>
              {config?.titleText || "Verification"}
            </Text>
          </View>
          <ThreeDS.Frame />
        </View>
      </View>
    </Modal>
  );
};


/*
    ThreeDSModal is a wrapper around the ThreeDS component that provides a modal UI for the 3DSecure flow.
    It takes the sessionId and callbacks as props and renders a modal with a close button and a title bar.
    The config prop allows you to customize the title text and close button text.
    The style prop allows you to customize the modal, modal content, title bar, title text, close button, and close button text.
*/
export const ThreeDSModal = (props: ThreeDSModalProps) => {
    const {sessionId, callbacks} = props;
    return (
        <ThreeDS sessionId={sessionId} callbacks={callbacks}>
            <ThreeDSModalInternal {...props} />
        </ThreeDS>
    );
}; 

export default ThreeDSModal;

const defaultStyles = StyleSheet.create({
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
  },
  titleBar: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    position: "relative",
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