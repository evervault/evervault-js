import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  RevealConsumerClientMessages,
  EvervaultFrameHostMessages,
} from "types";
import { resize } from "../utilities/resize";
import { useBroadcastChannel } from "../utilities/useBroadcastChannel";
import { useMessaging } from "../utilities/useMessaging";
import { resolveJSONPath } from "./utils";
import type { RevealBroadcastMessages, RevealCopyButtonConfig } from "./types";

export function RevealCopyButton({
  config,
}: {
  config: RevealCopyButtonConfig;
}) {
  const [text, setText] = useState<string | null>(null);
  const ready = useRef(false);
  const channel = useBroadcastChannel<RevealBroadcastMessages>(config.channel);
  const messages = useMessaging<
    EvervaultFrameHostMessages,
    RevealConsumerClientMessages
  >();

  useEffect(() => {
    if (ready.current) return;
    channel.send("REVEAL_CONSUMER_READY");
    messages.send("EV_REVEAL_CONSUMER_READY");
    ready.current = true;
  }, [messages, channel]);

  useLayoutEffect(() => {
    resize();
  });

  useEffect(() => {
    channel.on("DATA_RECEIVED", (data) => {
      const value = resolveJSONPath(data, config.path);
      setText(value);
    });
  }, [config.path, channel]);

  const handleClick = () => {
    if (!text) return;
    let value = text;
    if (config.format) {
      value = text.replace(config.format.regex, config.format.replace);
    }
    navigator.clipboard
      .writeText(value)
      .then(() => {
        messages.send("EV_COPY");
      })
      .catch(console.error);
  };

  if (!text) return null;

  return (
    <button onClick={handleClick}>
      {config.icon && <img src={config.icon} alt="" />}
      {config.text ?? "Copy"}
    </button>
  );
}
