import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resize } from "../utilities/resize";
import { useMessaging } from "../utilities/useMessaging";
import { useBroadcastChannel } from "../utilities/useBroadcastChannel";
import { RevealBroadcastMessages } from "./RevealRequest";
import type {
  RevealFormat,
  ThemeObject,
  EvervaultFrameHostMessages,
  RevealConsumerClientMessages,
} from "types";
import { resolveJSONPath } from "./utils";

type RevealTextConfig = {
  channel: string;
  path: string;
  theme?: ThemeObject;
  format?: RevealFormat;
};

export function RevealText({ config }: { config: RevealTextConfig }) {
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
  }, [text, messages, channel]);

  useLayoutEffect(() => {
    resize();
  });

  useEffect(() => {
    return channel.on("DATA_RECEIVED", (data) => {
      const text = resolveJSONPath(data, config.path);
      setText(text);
    });
  }, [config.path, channel]);

  const value = useMemo(() => {
    if (!text) return null;
    if (!config.format) return text;
    return text.replace(config.format.regex, config.format.replace);
  }, [text, config.format]);

  return <div>{value}</div>;
}
