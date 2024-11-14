// Posts the iframe size to the parent window

export function resize() {
  const height = document.body.scrollHeight;
  setSize({ height });
}

export function setSize(size: { width?: number; height: number }) {
  const { location } = window;
  const searchParams = new URLSearchParams(location.search);
  const frame = searchParams.get("id");

  window.parent.postMessage(
    {
      type: "EV_RESIZE",
      frame,
      payload: size,
    },
    "*"
  );
}
