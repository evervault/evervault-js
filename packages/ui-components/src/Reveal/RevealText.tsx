import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resize } from "../utilities/resize";
import { useBroadcastChannel } from "../utilities/useBroadcastChannel";
import { useMessaging } from "../utilities/useMessaging";
import { resolveJSONPath } from "./utils";
import type { RevealTextConfig, RevealBroadcastMessages } from "./types";
import type {
  EvervaultFrameHostMessages,
  RevealConsumerClientMessages,
} from "types";

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

  useEffect(
    () =>
      channel.on("DATA_RECEIVED", (data) => {
        const selection = resolveJSONPath(data, config.path);
        setText(selection);
      }),
    [config.path, channel]
  );

  const value = useMemo(() => {
    if (!text) return null;
    if (!config.format) return text;
    return text.replace(config.format.regex, config.format.replace);
  }, [text, config.format]);

  return <div>{value}</div>;
}
