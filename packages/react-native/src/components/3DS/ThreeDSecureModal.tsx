import React, { useContext } from "react";
import { Modal, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { ThreeDSecureModalProps, ThreeDSecureState } from "./types";
import { ThreeDSecureFrame } from "./ThreeDSecureFrame";
import { defaultModalStyles as defaultStyles } from "./styles";
import { ThreeDSecureContext } from "./context";

export const ThreeDSecureModal = ({config, style}: ThreeDSecureModalProps) => {

  const state: ThreeDSecureState | null = useContext(ThreeDSecureContext);

  if (!state) {
    throw new Error("ThreeDSecure.Modal must be used within an Evervault ThreeDSecure provider component");
  }

  const close3DS = async () => {
    if (state?.session) {
      await state.session.cancel();
    };
  };
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
              <ThreeDSecureFrame />
            </View>
        </View>
        </Modal>
    );
};