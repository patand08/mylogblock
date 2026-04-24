import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Clean up React Testing Library after each test
afterEach(() => {
  cleanup();
});
