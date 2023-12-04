import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { resize } from "../utilities/resize";
import { useMessaging } from "../utilities/useMessaging";
import { useBroadcastChannel } from "../utilities/useBroadcastChannel";
import {
  ThemeObject,
  RevealFormat,
  RevealConsumerClientMessages,
  EvervaultFrameHostMessages,
} from "types";
import { RevealBroadcastMessages } from "./RevealRequest";
import { resolveJSONPath } from "./utils";

type RevealCopyButtonConfig = {
  channel: string;
  path: string;
  text?: string;
  icon?: string;
  theme?: ThemeObject;
  format?: RevealFormat;
};

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
    navigator.clipboard.writeText(value);
    messages.send("EV_COPY");
  };

  if (!text) return null;

  return (
    <button onClick={handleClick}>
      {config.icon && <img src={config.icon} alt="" />}
      {config.text ?? "Copy"}
    </button>
  );
}
