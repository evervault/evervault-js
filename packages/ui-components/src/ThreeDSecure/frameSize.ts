// The 3DS window's size. `defaultFrameSize()` gives it in CSS units for the 3DS
// component. `profilingFrameSize()` gives the same size in pixels for 3DS
// profiling. Change both together.

/** The 3DS window's size on a screen that is large enough for it. */
const FRAME_WIDTH = 500;
const FRAME_HEIGHT = 600;

/** True when the 3DS window must fit the screen in place of its default size. */
function isSmallScreen(width: number, height: number) {
  return width < FRAME_WIDTH || height < FRAME_HEIGHT;
}

/** The 3DS window's size in CSS units, so the window follows a resize. */
export function defaultFrameSize(): { width: string; height: string } {
  if (isSmallScreen(window.innerWidth, window.innerHeight)) {
    return { width: "96vw", height: "calc(100vh - 100px)" };
  }

  return { width: `${FRAME_WIDTH}px`, height: `${FRAME_HEIGHT}px` };
}

/**
 * The size the 3DS window will probably have, in whole pixels.
 * The Card frame can't see the page, so this uses the screen in place of the
 * page's viewport.
 */
export function profilingFrameSize(): { width: number; height: number } {
  const { width, height } = window.screen;

  if (isSmallScreen(width, height)) {
    return {
      width: Math.round(width * 0.96),
      height: Math.max(0, Math.round(height) - 100),
    };
  }

  return { width: FRAME_WIDTH, height: FRAME_HEIGHT };
}
