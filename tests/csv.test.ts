import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv";

describe("csv.toCsv", () => {
  it("renders header + rows", () => {
    const csv = toCsv([{ a: 1, b: "two" }, { a: 3, b: "four" }]);
    expect(csv.split("\n")).toEqual(["a,b", "1,two", "3,four"]);
  });

  it("escapes commas and quotes", () => {
    const csv = toCsv([{ a: 'he said "hi"', b: "x,y" }]);
    expect(csv).toContain('"he said ""hi"""');
    expect(csv).toContain('"x,y"');
  });

  it("returns empty string for empty input", () => {
    expect(toCsv([])).toBe("");
  });
});
