import React from "react";
import { StyleSheet } from "react-native";
import { useThreeDS } from "./context";
import { useEvervault } from "../EvervaultProvider";
import { View } from "react-native";
import WebView from "react-native-webview";
import { THREE_D_S_CHALLENGE_DOMAIN } from "./utilities";

export function ThreeDSFrame() {
    const { session } = useThreeDS();
    const {teamUuid, appUuid} = useEvervault();

    if (!teamUuid || !appUuid) {
        throw new Error('Missing Evervault Team or App Uuid. Make sure the ThreeDSFrame is nested within the Evervault Provider');
    }

    return (
        <View style={[defaultStyles.threeDSFrame]}>
            <WebView
                source={{
                    uri: `https://${THREE_D_S_CHALLENGE_DOMAIN}/?session=${session.sessionId}&app=${appUuid}&team=${teamUuid}`
                }}
                />
        </View>
    );
}

const defaultStyles = StyleSheet.create({
    threeDSFrame: {
        flex: 1,
    }
});