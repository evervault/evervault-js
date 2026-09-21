import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only sets this around its own `act`, not around React's, which
// is the one the component tests call.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// The card's inputs are looked up by id, so an earlier render must not stay in
// the document.
afterEach(cleanup);
