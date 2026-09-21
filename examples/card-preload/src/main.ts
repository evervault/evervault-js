import { loadEvervault } from "@evervault/js";
import "./style.css";

type VariantKey = "baseline" | "preload";

const PHASES = [
  { key: "mount", label: "Mount" },
  { key: "boot", label: "Boot (network+parse)" },
  { key: "js", label: "JS boot" },
  { key: "render", label: "Init+render" },
  { key: "total", label: "Total" },
] as const;

function renderPhaseRows(variant: VariantKey) {
  const container = document.getElementById(`phase-output-${variant}`)!;
  container.innerHTML = PHASES.map(
    ({ key, label }) =>
      `<div class="phase-row phase-pending${
        key === "total" ? " phase-total" : ""
      }" data-phase="${key}">${label}<span></span></div>`
  ).join("");
}

async function setupVariant(variant: VariantKey) {
  renderPhaseRows(variant);

  const evervault = await loadEvervault(
    import.meta.env.VITE_EV_TEAM_UUID,
    import.meta.env.VITE_EV_APP_UUID,
    {
      urls: {
        keysUrl: import.meta.env.VITE_KEYS_URL!,
        apiUrl: import.meta.env.VITE_API_URL!,
        componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL!,
      },
    }
  );

  const card = evervault.ui.card({
    icons: true,
    theme: evervault.ui.themes.clean(),
    autoProgress: true,
  });

  card.on("change", (values) => {
    console.log(`[${variant}] Change`, values);
  });

  function setPhase(phase: string, durationMs: number) {
    const row = document.querySelector<HTMLElement>(
      `#phase-output-${variant} [data-phase="${phase}"]`
    )!;
    row.classList.remove("phase-pending");
    row.querySelector("span")!.textContent = `${durationMs.toFixed(1)}ms`;
  }

  function mark(name: string) {
    performance.mark(`ev:${variant}:${name}`);
  }
  function measure(name: string, start: string, end: string) {
    return performance.measure(
      `ev:${variant}:measure:${name}`,
      `ev:${variant}:${start}`,
      `ev:${variant}:${end}`
    );
  }

  let preloaded = false;
  let phaseStartMark = "call-end";
  let finishGauge = () => {};

  function maybeAdvance() {
    const has = (mark: string) =>
      performance.getEntriesByName(`ev:${variant}:${mark}`).length > 0;

    const transitions = [
      { phase: "boot", from: phaseStartMark, to: "load" },
      { phase: "js", from: "load", to: "handshake" },
      { phase: "render", from: "handshake", to: "ready" },
    ] as const;

    for (const { phase, from, to } of transitions) {
      if (has(from) && has(to) && !has(`measure:${phase}`)) {
        setPhase(phase, measure(phase, from, to).duration);
      }
    }
  }

  card.on("frameLoad", () => {
    mark("load");
    maybeAdvance();
  });
  card.on("handshake", () => {
    mark("handshake");
    maybeAdvance();
  });
  card.on("ready", () => {
    mark("ready");
    maybeAdvance();
    finishGauge();
  });

  const makePaymentBtn = document.getElementById(
    `make-payment-${variant}`
  ) as HTMLButtonElement | null;

  if (variant === "preload") {
    preloaded = true;
    phaseStartMark = "preload-start";
    mark("preload-start");

    const gaugeRoot = document.getElementById("preload-status")!;
    const gaugeLabel = document.getElementById("preload-label")!;
    const gaugeTime = document.getElementById("preload-time")!;
    const gaugeFill = document.getElementById("preload-fill")!;
    const gaugeStartedAt = performance.now();
    let ticking = true;

    const tick = () => {
      if (!ticking) return;
      gaugeTime.textContent = `${Math.round(
        performance.now() - gaugeStartedAt
      )}ms`;
      requestAnimationFrame(tick);
    };
    tick();

    finishGauge = () => {
      ticking = false;
      gaugeRoot.dataset.state = "ready";
      gaugeLabel.textContent = "Ready, waiting for click";
      gaugeTime.textContent = `${Math.round(
        performance.now() - gaugeStartedAt
      )}ms`;
      gaugeFill.style.width = "100%";
    };

    card.preload(`#form-${variant}`);
  }

  makePaymentBtn?.addEventListener("click", () => {
    mark("click");

    if (preloaded) {
      card.reveal();
    } else {
      card.mount(`#form-${variant}`);
    }

    mark("call-end");
    setPhase("mount", measure("mount", "click", "call-end").duration);

    if (preloaded) {
      setPhase("total", measure("total", "click", "call-end").duration);
    } else {
      card.on("ready", () => {
        setPhase("total", measure("total", "click", "ready").duration);
      });
    }

    makePaymentBtn.disabled = true;
  });
}

await Promise.all([setupVariant("baseline"), setupVariant("preload")]);
