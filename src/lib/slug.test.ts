import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("normalizes titles", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});

describe("uniqueSlug", () => {
  it("adds suffix", () => {
    expect(uniqueSlug("test")).toMatch(/^test-[a-zA-Z0-9_-]{6}$/);
  });
});
