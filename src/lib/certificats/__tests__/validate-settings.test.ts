import { describe, expect, it } from "vitest";
import { EXAMPLE_SETTINGS_V1 } from "../tmh-package";
import { parseOffsets, validateTemplateSettings } from "../validate-settings";

describe("validateTemplateSettings", () => {
  it("accepte l'exemple V1", () => {
    const res = validateTemplateSettings(EXAMPLE_SETTINGS_V1);
    expect(res.ok).toBe(true);
  });

  it("accepte le libellé français et normalise l'identifiant", () => {
    const res = validateTemplateSettings({
      page_width_mm: 297,
      page_height_mm: 210,
      fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
      fields: [
        {
          id: "Nom complet",
          x_mm: 10,
          y_mm: 20,
          fontSize_pt: 18,
          fontFamily: "Lato",
        },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.settings.fields[0].id).toBe("nom_complet");
  });

  it("rejette une clé inconnue", () => {
    const res = validateTemplateSettings({ ...EXAMPLE_SETTINGS_V1, auteur: "x" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/inconnue/i);
  });

  it("rejette un champ hors liste et une coordonnée hors page", () => {
    const base = {
      page_width_mm: 297,
      page_height_mm: 210,
      fonts: [{ family: "Lato", file: "Lato-Regular.ttf" }],
      fields: [
        {
          id: "club",
          x_mm: 10,
          y_mm: 10,
          fontSize_pt: 12,
          fontFamily: "Lato",
        },
      ],
    };
    const unknown = validateTemplateSettings(base);
    expect(unknown.ok).toBe(false);

    const outside = validateTemplateSettings({
      ...base,
      fields: [{ ...base.fields[0], id: "course", x_mm: 400 }],
    });
    expect(outside.ok).toBe(false);
    if (!outside.ok) expect(outside.errors.join(" ")).toMatch(/hors de la page/);
  });

  it("rejette un nombre écrit en texte et une police grasse absente", () => {
    const textNumber = validateTemplateSettings({
      page_width_mm: "297",
      page_height_mm: 210,
      fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
      fields: [
        {
          id: "course",
          x_mm: 10,
          y_mm: 10,
          fontSize_pt: 12,
          fontFamily: "Lato",
        },
      ],
    });
    expect(textNumber.ok).toBe(false);

    const missingBold = validateTemplateSettings({
      page_width_mm: 297,
      page_height_mm: 210,
      fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
      fields: [
        {
          id: "nom_complet",
          x_mm: 10,
          y_mm: 10,
          fontSize_pt: 20,
          fontFamily: "Lato",
          fontWeight: "bold",
        },
      ],
    });
    expect(missingBold.ok).toBe(false);
    if (!missingBold.ok) expect(missingBold.errors.join(" ")).toMatch(/gras/);
  });
});

describe("parseOffsets", () => {
  it("accepte un petit décalage et refuse une clé inconnue", () => {
    const ok = parseOffsets({ nom_complet: { dx_mm: 1.5, dy_mm: -2 } });
    expect(ok.ok).toBe(true);
    const bad = parseOffsets({ email: { dx_mm: 1, dy_mm: 0 } });
    expect(bad.ok).toBe(false);
    const huge = parseOffsets({ course: { dx_mm: 80, dy_mm: 0 } });
    expect(huge.ok).toBe(false);
  });
});
