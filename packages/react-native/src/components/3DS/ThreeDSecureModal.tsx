import React from "react";
import { Modal, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { ThreeDSecureModalProps } from "./types";
import { ThreeDSecureFrame } from "./ThreeDSecureFrame";
import { defaultModalStyles as defaultStyles } from "./styles";

export const ThreeDSecureModal = ({state, config, style}: ThreeDSecureModalProps) => {
  const close3DS = async () => {
    if (state?.session) {
      await state.session.cancel();
    };
  };

  if (state.session && state.displayModal) {
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
              <ThreeDSecureFrame sessionId={state.session.sessionId} />
            </View>
        </View>
        </Modal>
    );
  } else {
    return null;
  }
};