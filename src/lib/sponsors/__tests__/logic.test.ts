import { describe, it, expect } from "vitest";
import {
  isSponsorActiveOn,
  isSponsorExcludedPath,
  pickRotatedSponsor,
  sponsorsForPopup,
  sponsorsForBand,
  filterActiveSponsors,
  isAllowedSponsorImageType,
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
