import { describe, expect, it } from "vitest";
import { isAllowedAdminEmail } from "../admin-allowlist";

describe("isAllowedAdminEmail", () => {
  it("refuse tout le monde si la liste est vide", () => {
    expect(isAllowedAdminEmail("admin@exemple.com", "")).toBe(false);
    expect(isAllowedAdminEmail("admin@exemple.com", "   ")).toBe(false);
    expect(isAllowedAdminEmail("admin@exemple.com", undefined)).toBe(false);
  });

  it("accepte uniquement les adresses listées, sans tenir compte de la casse", () => {
    const raw = "Hoby@Exemple.com, autre@exemple.com";
    expect(isAllowedAdminEmail("hoby@exemple.com", raw)).toBe(true);
    expect(isAllowedAdminEmail("autre@exemple.com", raw)).toBe(true);
    expect(isAllowedAdminEmail("intrus@exemple.com", raw)).toBe(false);
  });
});
