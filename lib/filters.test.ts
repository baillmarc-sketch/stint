import { describe, it, expect } from "vitest";
import { parseFilters } from "@/lib/filters";

describe("parseFilters", () => {
  it("parses price ranges into cents", () => {
    expect(parseFilters({ price: "25000-50000" })).toMatchObject({
      minPriceCents: 25000,
      maxPriceCents: 50000,
    });
    expect(parseFilters({ price: "100000-" })).toMatchObject({
      minPriceCents: 100000,
      maxPriceCents: undefined,
    });
    expect(parseFilters({ price: "0-25000" }).maxPriceCents).toBe(25000);
  });

  it("defaults sort to recommended and rejects unknown values", () => {
    expect(parseFilters({}).sort).toBe("recommended");
    expect(parseFilters({ sort: "rating" }).sort).toBe("rating");
    expect(parseFilters({ sort: "bogus" }).sort).toBe("recommended");
  });

  it("pins the category over the URL param", () => {
    expect(parseFilters({ category: "djs" }, "chefs").categorySlug).toBe("chefs");
    expect(parseFilters({ category: "djs" }).categorySlug).toBe("djs");
  });

  it("reads the instant-book flag and text query", () => {
    expect(parseFilters({ instant: "1" }).instantBook).toBe(true);
    expect(parseFilters({ instant: "0" }).instantBook).toBe(false);
    expect(parseFilters({ q: "hibachi" }).query).toBe("hibachi");
  });

  it("takes the first value of array params", () => {
    expect(parseFilters({ q: ["hibachi", "dj"] }).query).toBe("hibachi");
  });
});
