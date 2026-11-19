import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserDetails } from "./browserDetails";
import { getDeviceId } from "./deviceId";
import { profilingFrameSize } from "./frameSize";
import {
  createProfiling,
  ProfilingError,
  reportProfilingMethod,
} from "./profiling";
import type { BrowserFingerprintNextAction } from "./types";

interface ThreeDSProfilingOptions {
  enabled: boolean;
  app: string;
  /** The card number when it is valid, otherwise `null`. */
  cardNumber: string | null;
}

interface ThreeDSProfiling {
  /** The ID to send with the card. `null` until profiling for this number is done. */
  profilingId: string | null;
  /** The issuer's 3DS Method to load in a hidden frame, if there is one. */
  method: BrowserFingerprintNextAction | null;
  onMethodComplete: () => void;
  onMethodTimeout: () => void;
}

/** A profiling that waits for its 3DS Method to finish. */
interface PendingMethod {
  app: string;
  cardNumber: string;
  profilingId: string;
  signal: AbortSignal;
}

// 403: profiling flag is off for the app.
// 404: the app is unknown.
// Neither changes while the frame is open, so there is no reason to try again.
const STOP_STATUSES = [403, 404];

/**
 * Profiles the browser for 3DS when the shopper enters a valid card number, so
 * the 3DS session can skip its own 3DS Method step. Errors are never shown: the
 * profiling ID stays `null`, and 3DS works as it does without profiling.
 */
export function useThreeDSProfiling({
  enabled,
  app,
  cardNumber,
}: ThreeDSProfilingOptions): ThreeDSProfiling {
  // The ID is kept with its number, so an ID for an old number is never returned.
  const [profiledCard, setProfiledCard] = useState<{
    cardNumber: string;
    profilingId: string;
  } | null>(null);
  const [method, setMethod] = useState<BrowserFingerprintNextAction | null>(
    null,
  );
  const [stopped, setStopped] = useState(false);
  const pendingMethod = useRef<PendingMethod | null>(null);

  const active = enabled && app !== "" && !stopped;

  // Start to read the device ID now, so it is usually ready before the number.
  useEffect(() => {
    if (active) void getDeviceId();
  }, [active]);

  useEffect(() => {
    setProfiledCard(null);
    setMethod(null);
    pendingMethod.current = null;

    if (!active || cardNumber === null) return;

    // The signal also marks the results of an old number: when the number
    // changes, this run is aborted and its late results are ignored.
    const controller = new AbortController();
    const { signal } = controller;

    async function profile(number: string) {
      try {
        const deviceId = await getDeviceId();
        if (signal.aborted) return;

        const response = await createProfiling(
          app,
          {
            cardNumber: number,
            browser: {
              ...getBrowserDetails(),
              ...(deviceId ? { deviceId } : {}),
            },
            frame: profilingFrameSize(),
          },
          signal,
        );
        if (signal.aborted) return;

        if (response.methodUrl && response.threeDSMethodData) {
          pendingMethod.current = {
            app,
            cardNumber: number,
            profilingId: response.profilingId,
            signal,
          };
          setMethod({
            type: "browser-fingerprint",
            url: response.methodUrl,
            data: response.threeDSMethodData,
          });
        } else {
          setProfiledCard({
            cardNumber: number,
            profilingId: response.profilingId,
          });
        }
      } catch (error) {
        if (signal.aborted) return;
        if (
          error instanceof ProfilingError &&
          STOP_STATUSES.includes(error.status)
        ) {
          setStopped(true);
        }
        // Other errors: the ID stays `null`, and the next number tries again.
      }
    }

    void profile(cardNumber);

    return () => controller.abort();
  }, [active, app, cardNumber]);

  // Stable callback (read from a ref): `BrowserFingerprint` restarts its timer on change.
  const onMethodComplete = useCallback(() => {
    const pending = pendingMethod.current;
    if (!pending) return;
    pendingMethod.current = null;
    setMethod(null);

    // Send the ID only after the backend knows the 3DS Method finished.
    // Otherwise the 3DS session could read the profiling before the update.
    const showId = () => {
      if (!pending.signal.aborted) setProfiledCard(pending);
    };
    reportProfilingMethod(
      pending.app,
      pending.profilingId,
      "complete",
      pending.signal,
    ).then(showId, (error: unknown) => {
      // 404: the backend has no record for this ID, so the ID is useless.
      if (error instanceof ProfilingError && error.status === 404) return;
      // Other errors: the backend treats a missing update as a timeout, so the ID still works.
      showId();
    });
  }, []);

  // Stable callback (read from a ref): `BrowserFingerprint` restarts its timer on change.
  const onMethodTimeout = useCallback(() => {
    const pending = pendingMethod.current;
    if (!pending) return;
    pendingMethod.current = null;
    setMethod(null);
    setProfiledCard(pending);

    // The backend treats a missing update as a timeout,
    // so this request is not awaited, and its errors are ignored.
    reportProfilingMethod(pending.app, pending.profilingId, "timeout").catch(
      () => undefined,
    );
  }, []);

  const profilingId =
    active && profiledCard?.cardNumber === cardNumber
      ? profiledCard.profilingId
      : null;

  return { profilingId, method, onMethodComplete, onMethodTimeout };
}
