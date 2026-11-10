import { describe, it, expect } from "vitest";
import { parseResultsBuffer } from "../parse-results";
import { normalizeNom } from "../normalize";
import { EXAMPLE_SETTINGS_V1 } from "../tmh-package";

const sample = `"Édition";"Course";"Dossard";"Prénom";"Nom";"Genre";"Catégorie";"Nationalité";"Statut";"Temps";"Classement scratch";"Classement genre";"Classement catégorie"
"2026";"Trail Découverte";"101";"Aina";"RABE";"F";"SEF";"MG";"FINISHER";"01:42:18";"12";"3";"2"
"2026";"Trail Découverte";"102";"Lala";"ANDRIA";"F";"SEF";"MG";"DNF";"";"";"";""
`;

describe("parseResultsBuffer", () => {
  it("parse un CSV valide", () => {
    const buf = Buffer.from(sample, "utf8");
    const p = parseResultsBuffer(buf, "test.csv");
    expect(p.ok).toBe(true);
    expect(p.total).toBe(2);
    expect(p.finishers).toBe(1);
    expect(p.rows[0].nom_norm).toBe(normalizeNom("RABE"));
  });

  it("refuse une colonne interdite", () => {
    const bad =
      `"Édition";"Course";"Dossard";"Prénom";"Nom";"Genre";"Catégorie";"Nationalité";"Statut";"Temps";"Classement scratch";"Classement genre";"Classement catégorie";"Email"\n` +
      `"2026";"Trail Découverte";"1";"A";"B";"H";"SEH";"MG";"FINISHER";"01:00:00";"1";"1";"1";"x@y.z"\n`;
    const p = parseResultsBuffer(Buffer.from(bad), "bad.csv");
    expect(p.ok).toBe(false);
    expect(p.errors.some((e) => /interdite/i.test(e))).toBe(true);
  });

  it("détecte les doublons de dossard", () => {
    const dup =
      `"Édition";"Course";"Dossard";"Prénom";"Nom";"Genre";"Catégorie";"Nationalité";"Statut";"Temps";"Classement scratch";"Classement genre";"Classement catégorie"\n` +
      `"2026";"Trail Découverte";"101";"A";"RABE";"F";"SEF";"MG";"FINISHER";"01:00:00";"1";"1";"1"\n` +
      `"2026";"Trail Découverte";"101";"B";"RAKOTO";"H";"SEH";"MG";"FINISHER";"01:01:00";"2";"2";"2"\n`;
    const p = parseResultsBuffer(Buffer.from(dup), "dup.csv");
    expect(p.ok).toBe(false);
    expect(p.duplicates.length).toBeGreaterThan(0);
  });
});

describe("EXAMPLE_SETTINGS_V1", () => {
  it("définit les champs obligatoires", () => {
    const ids = EXAMPLE_SETTINGS_V1.fields.map((f) => f.id);
    expect(ids).toEqual(
      expect.arrayContaining(["nom_complet", "course", "temps", "classement", "edition"])
    );
  });
});
