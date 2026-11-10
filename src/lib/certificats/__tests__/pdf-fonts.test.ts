import { describe, it, expect } from "vitest";
import { buildCertificatePdf, FICTIVE_RUNNER } from "../pdf";
import { EXAMPLE_SETTINGS_V1 } from "../tmh-package";

/** Sans vraie police TTF du paquet TMH, le générateur doit refuser (pas de substitution). */
describe("buildCertificatePdf", () => {
  it("refuse si les polices du modèle manquent", async () => {
    // 1x1 PNG
    const png = Uint8Array.from(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      )
    );
    const res = await buildCertificatePdf({
      background: png,
      backgroundMime: "image/png",
      settings: EXAMPLE_SETTINGS_V1,
      fonts: [], // volontairement vide
      runner: FICTIVE_RUNNER,
    });
    expect(res.ok).toBe(false);
    expect(res.error || "").toMatch(/[Pp]olice/);
  });
});
