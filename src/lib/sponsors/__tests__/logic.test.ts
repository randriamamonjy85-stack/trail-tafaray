import { describe, it, expect } from "vitest";
import {
  isSponsorActiveOn,
  isSponsorExcludedPath,
  pickRotatedSponsor,
  sponsorsForPopup,
  sponsorsForBand,
  filterActiveSponsors,
  isAllowedSponsorImageType,
  INVALID_SPONSOR_SITE_URL_MESSAGE,
  SPONSOR_SITE_URL_MAX_LENGTH,
  normalizeSponsorSiteUrl,
  sponsorSiteHref,
} from "../logic";

const base = {
  id: "1",
  nom: "Acme",
  image_url: "https://example.com/a.png",
  actif: true,
  ordre: 0,
  afficher_popup: true,
  afficher_bande: true,
};

describe("isSponsorExcludedPath", () => {
  it("exclut inscription, admin, certificat", () => {
    expect(isSponsorExcludedPath("/inscription")).toBe(true);
    expect(isSponsorExcludedPath("/inscription?course=x")).toBe(true);
    expect(isSponsorExcludedPath("/admin")).toBe(true);
    expect(isSponsorExcludedPath("/admin/foo")).toBe(true);
    expect(isSponsorExcludedPath("/certificat")).toBe(true);
  });
  it("autorise l'accueil et partenaires", () => {
    expect(isSponsorExcludedPath("/")).toBe(false);
    expect(isSponsorExcludedPath("/partenaires")).toBe(false);
    expect(isSponsorExcludedPath("/courses")).toBe(false);
  });
});

describe("isSponsorActiveOn", () => {
  const day = new Date(Date.UTC(2026, 10, 11)); // 11 nov 2026
  it("respecte actif=false", () => {
    expect(isSponsorActiveOn({ ...base, actif: false }, day)).toBe(false);
  });
  it("respecte date_debut / date_fin", () => {
    expect(
      isSponsorActiveOn({ ...base, date_debut: "2026-11-12", date_fin: null }, day)
    ).toBe(false);
    expect(
      isSponsorActiveOn({ ...base, date_debut: "2026-11-01", date_fin: "2026-11-11" }, day)
    ).toBe(true);
    expect(
      isSponsorActiveOn({ ...base, date_debut: null, date_fin: "2026-11-10" }, day)
    ).toBe(false);
  });
});

describe("rotation et filtres", () => {
  const list = [
    { ...base, id: "a", ordre: 1, afficher_popup: true, afficher_bande: false },
    { ...base, id: "b", ordre: 0, afficher_popup: true, afficher_bande: true },
    { ...base, id: "c", ordre: 2, afficher_popup: false, afficher_bande: true },
  ];
  it("ordonne et filtre", () => {
    const act = filterActiveSponsors(list);
    expect(act.map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(sponsorsForPopup(list).map((s) => s.id)).toEqual(["b", "a"]);
    expect(sponsorsForBand(list).map((s) => s.id)).toEqual(["b", "c"]);
  });
  it("rotation cyclique", () => {
    const pop = sponsorsForPopup(list);
    expect(pickRotatedSponsor(pop, 0)?.id).toBe("b");
    expect(pickRotatedSponsor(pop, 1)?.id).toBe("a");
    expect(pickRotatedSponsor(pop, 2)?.id).toBe("b");
    expect(pickRotatedSponsor([], 0)).toBeNull();
  });
});

describe("images", () => {
  it("accepte png jpeg webp seulement", () => {
    expect(isAllowedSponsorImageType("image/png")).toBe(true);
    expect(isAllowedSponsorImageType("image/svg+xml")).toBe(false);
  });
});

describe("site_url", () => {
  it("autorise le vide", () => {
    expect(normalizeSponsorSiteUrl(null)).toEqual({ ok: true, url: null });
    expect(normalizeSponsorSiteUrl(undefined)).toEqual({ ok: true, url: null });
    expect(normalizeSponsorSiteUrl("")).toEqual({ ok: true, url: null });
    expect(normalizeSponsorSiteUrl("   ")).toEqual({ ok: true, url: null });
    expect(sponsorSiteHref(null)).toBeNull();
    expect(sponsorSiteHref("")).toBeNull();
    expect(sponsorSiteHref("   ")).toBeNull();
  });

  it("accepte une URL http ou https", () => {
    expect(normalizeSponsorSiteUrl("https://example.com/page?q=1")).toEqual({
      ok: true,
      url: "https://example.com/page?q=1",
    });
    expect(normalizeSponsorSiteUrl("  http://example.com/a  ")).toEqual({
      ok: true,
      url: "http://example.com/a",
    });
    expect(sponsorSiteHref("HTTPS://Example.com/a")).toBe("https://example.com/a");
    expect(sponsorSiteHref("http://127.0.0.1:3000/x")).toBe("http://127.0.0.1:3000/x");
  });

  it("refuse les liens qui ne sont pas http(s), avec un message en français", () => {
    const refused = [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(document.domain)",
      "javascript://example.com/%0aalert(1)",
      "data:text/html,hi",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "ftp://example.com",
      "mailto:a@b.c",
      "//example.com",
      "/partenaires",
      "https:example.com",
      "http:/example.com",
      "http://",
      "https://",
      "notaurl",
      'https://ok.com"onclick="alert(1)',
      "https://example.com/\njavascript:alert(1)",
      "https://example.com\\@evil.com",
    ];
    for (const value of refused) {
      expect(normalizeSponsorSiteUrl(value), value).toEqual({
        ok: false,
        error: INVALID_SPONSOR_SITE_URL_MESSAGE,
      });
      const href = sponsorSiteHref(value);
      expect(href, value).toBeNull();
    }
    expect(normalizeSponsorSiteUrl(123)).toEqual({
      ok: false,
      error: INVALID_SPONSOR_SITE_URL_MESSAGE,
    });
  });

  it("ne rend jamais un href qui ne commence pas par http:// ou https://", () => {
    const href = sponsorSiteHref("https://example.com/javascript:alert(1)");
    expect(href).toMatch(/^https?:\/\//);
    expect(href?.toLowerCase().startsWith("javascript:")).toBe(false);
  });

  it("refuse un lien plus long que la limite", () => {
    const long = "https://example.com/" + "a".repeat(SPONSOR_SITE_URL_MAX_LENGTH);
    expect(long.length).toBeGreaterThan(SPONSOR_SITE_URL_MAX_LENGTH);
    expect(normalizeSponsorSiteUrl(long)).toEqual({
      ok: false,
      error: INVALID_SPONSOR_SITE_URL_MESSAGE,
    });
  });
});
