import React from "react";
import { StyleSheet } from "react-native";
import { useThreeDSSession } from "./context";
import { useEvervault } from "../EvervaultProvider";
import { View } from "react-native";
import WebView from "react-native-webview";
import { CHALLENGE_DOMAIN_3DS } from "./config";

/*
    Use the ThreeDSFrame component to display the 3DS challenge webview frame in your app.
*/
export function ThreeDSFrame() {
    const { session } = useThreeDSSession();
    const {teamUuid, appUuid} = useEvervault();

    if (!teamUuid || !appUuid) {
        throw new Error('Missing Evervault Team or App Uuid. Make sure the ThreeDSFrame is nested within the Evervault Provider');
    }

    return (
        <View style={[defaultStyles.threeDSFrame]}>
            <WebView
                source={{
                    uri: `https://${CHALLENGE_DOMAIN_3DS}/?session=${session.sessionId}&app=${appUuid}&team=${teamUuid}`
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