import { useCallback, useEffect, useRef, useState } from "react";
import { useMessaging } from "../utilities/useMessaging";
import { useBroadcastChannel } from "../utilities/useBroadcastChannel";
import {
  type EvervaultFrameHostMessages,
  type RevealRequestClientMessages,
} from "types";

type RevealRequestConfig = {
  channel: string;
  request: Request;
};

export type RevealBroadcastMessages = {
  DATA_RECEIVED: JSON;
  REVEAL_CONSUMER_READY: null;
};

export function RevealRequest({ config }: { config: RevealRequestConfig }) {
  const called = useRef(false);
  const [data, setData] = useState(null);
  const messages = useMessaging<
    EvervaultFrameHostMessages,
    RevealRequestClientMessages
  >();
  const channel = useBroadcastChannel<RevealBroadcastMessages>(config.channel);

  const publishData = useCallback(() => {
    if (!data) return;

    channel.send("DATA_RECEIVED", data);
  }, [channel, data]);

  useEffect(publishData, [publishData]);

  useEffect(() => {
    if (called.current) return;

    async function makeRequest() {
      try {
        called.current = true;
        const response = await fetch(config.request.url, {
          cache: config.request.cache,
          credentials: config.request.credentials,
          integrity: config.request.integrity,
          keepalive: config.request.keepalive,
          method: config.request.method,
          mode: config.request.mode,
          referrer: config.request.referrer,
          referrerPolicy: config.request.referrerPolicy,
          headers: config.request.headers,
          body: config.request.body ? config.request.body : undefined,
        });

        const d = await response.json();
        if (!response.ok) throw new Error("Request failed");

        setData(d);
        messages.send("EV_REVEAL_REQUEST_READY");
      } catch (e) {
        console.error(e);
        messages.send("EV_ERROR");
      }
    }

    makeRequest();
  }, [config.request, messages]);

  useEffect(() => {
    channel.on("REVEAL_CONSUMER_READY", publishData);
  }, [channel, publishData]);

  return null;
}
