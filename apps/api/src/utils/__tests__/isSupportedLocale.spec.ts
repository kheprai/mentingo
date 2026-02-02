import { isSupportedLocale } from "../isSupportedLocale";

describe("isSupportedLocale", () => {
  it("returns true for 'en'", () => {
    expect(isSupportedLocale("en")).toBe(true);
  });

  it("returns true for 'es'", () => {
    expect(isSupportedLocale("es")).toBe(true);
  });

  it("returns false for unsupported locale", () => {
    expect(isSupportedLocale("de")).toBe(false);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("pl")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSupportedLocale(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isSupportedLocale(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSupportedLocale("")).toBe(false);
  });

  it("returns false for number", () => {
    expect(isSupportedLocale(123)).toBe(false);
  });

  it("returns false for object", () => {
    expect(isSupportedLocale({ locale: "en" })).toBe(false);
  });

  it("returns false for array", () => {
    expect(isSupportedLocale(["en"])).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isSupportedLocale("EN")).toBe(false);
    expect(isSupportedLocale("ES")).toBe(false);
    expect(isSupportedLocale("En")).toBe(false);
  });
});
