import { ThreeDSFrameHostMessages, ThreeDSFrameClientMessages } from "types";
import { useMessaging } from "../utilities/useMessaging";
import { useEvervault } from "@evervault/react";
import { ThreeDSConfig } from "./types";
import { useEffect, useState } from "react";
import './style.css';

export function ThreeDS({ config }: { config: ThreeDSConfig }) {
  const { on, send } = useMessaging<
    ThreeDSFrameHostMessages,
    ThreeDSFrameClientMessages
  >();

  let [doChallenge, setDoChallenge] = useState(false)

  let methodFrame: HTMLIFrameElement;
  let challengeFrame: HTMLIFrameElement;
  let fingerprintForm: HTMLFormElement;
  let challengeForm: HTMLFormElement;

  const loadChallengeFrame = () => {
    const challengeContainer = document.getElementById("challengediv");
    if (challengeContainer) {
      challengeFrame = document.createElement("iframe");
      challengeFrame.style.width = "390px";
      challengeFrame.style.height = "400px";
      challengeFrame.style.border = "0";
      challengeFrame.id = "EMV3DSChallengeWindow";
      challengeFrame.name = "EMV3DSChallengeWindow";
      challengeFrame.allow = "payment *; public-key-credentials-get *";
      challengeContainer.appendChild(challengeFrame);

      // Create form and post
      challengeForm = document.createElement("form");
      challengeForm.method = "POST";
      challengeForm.action = "challenge.html";
      challengeForm.target = "EMV3DSChallengeWindow";

      const creqInput = document.createElement("input");
      creqInput.type = "hidden";
      creqInput.name = "creq";
      creqInput.value = "";
      challengeForm.appendChild(creqInput);
      const threeDSSessionDataInput = document.createElement("input");
      threeDSSessionDataInput.type = "hidden";
      threeDSSessionDataInput.name = "threeDSSessionData";
      threeDSSessionDataInput.value = "";
      challengeForm.appendChild(threeDSSessionDataInput);

      document.body.appendChild(challengeForm);

      challengeForm.submit();
    }
  }
  
  const loadHiddenFrame = () => {
    // Create empty iFrame
    methodFrame = document.createElement("iframe");
    methodFrame.style.visibility = "hidden";
    methodFrame.id = "3DSMethodFrame";
    methodFrame.name = "3DSMethodFrame";
    methodFrame.style.width = "10";
    methodFrame.style.height = "10";
    methodFrame.style.border = "0";
    document.body.appendChild(methodFrame);

    // Create form and post
    fingerprintForm = document.createElement("form");
    fingerprintForm.method = "POST";
    fingerprintForm.action = "fingerprint.html" // TODO: Substitute with 3DS Method URL
    fingerprintForm.target = "3DSMethodFrame";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "threeDSMethodData";
    input.value = "";
    fingerprintForm.appendChild(input);

    methodFrame.appendChild(fingerprintForm);
    fingerprintForm.submit();
  }

  const receiveMessage = (event: MessageEvent) => {
    if (event.data === "use-sdk") {
      console.log("Fingerprint Check Complete. Do Challenge Flow");
      methodFrame.remove(); 
      setDoChallenge(true);
      loadChallengeFrame();
    }

    if (event.data === "challenge-complete") {
      console.log("Challenge Complete. Send to EV");
      challengeFrame.remove();
      window.parent.postMessage("3ds-complete", "*");
    }
  }

  useEffect(() => {
    window.addEventListener("message", receiveMessage, false);
    loadHiddenFrame();
  })
  
  const ev = useEvervault();

  return (
    <div>
        {!doChallenge ? (
            <div className="loaderContent">
                <div className="loader"></div>
                <img src="https://cdn.visa.com/v2/assets/images/logos/visa/blue/logo.png" alt="" />
            </div>
        ) : (<div id="challengediv" ></div>)}
    </div>
  );
}