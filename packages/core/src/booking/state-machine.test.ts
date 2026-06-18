import { describe, it, expect } from "vitest";
import { canTransition, isTerminal, initialStatus } from "./state-machine";

describe("booking state machine", () => {
  it("allows legal transitions", () => {
    expect(canTransition("requested", "confirmed")).toBe(true);
    expect(canTransition("requested", "quoted")).toBe(true);
    expect(canTransition("quoted", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("confirmed", "in_progress")).toBe(true);
  });

  it("rejects illegal transitions", () => {
    expect(canTransition("requested", "completed")).toBe(false);
    expect(canTransition("completed", "confirmed")).toBe(false);
    expect(canTransition("declined", "confirmed")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });

  it("identifies terminal states", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("declined")).toBe(true);
    expect(isTerminal("requested")).toBe(false);
    expect(isTerminal("confirmed")).toBe(false);
  });

  it("picks the initial status from instant-book", () => {
    expect(initialStatus(true)).toBe("confirmed");
    expect(initialStatus(false)).toBe("requested");
  });
});
