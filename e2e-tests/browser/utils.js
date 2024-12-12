import { test as baseTest } from "@playwright/test";
export { expect } from "@playwright/test";
import { extendTest } from "@repo/test-coverage";

export const test = extendTest(baseTest);
