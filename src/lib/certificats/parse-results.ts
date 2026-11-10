import * as XLSX from "xlsx";
import {
  ALLOWED_STATUTS,
  REQUIRED_HEADERS,
  isForbiddenHeader,
  isValidTemps,
  normalizeDossard,
  normalizeNom,
  sanitizeField,
  type StatutCert,
} from "./normalize";

export type ResultRow = {
  edition: string;
  course: string;
  dossard: string;
  prenom: string;
  nom: string;
  nom_norm: string;
  genre: string;
  categorie: string;
  nationalite: string;
  statut: StatutCert;
  temps: string;
  classement_scratch: string;
  classement_genre: string;
  classement_categorie: string;
};

export type ParsePreview = {
  ok: boolean;
  rows: ResultRow[];
  errors: string[];
  warnings: string[];
  total: number;
  finishers: number;
  duplicates: string[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ";") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        /* skip */
      } else cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function headerMatches(actual: string[], required: readonly string[]): boolean {
  if (actual.length < required.length) return false;
  return required.every((r, i) => actual[i]?.trim() === r);
}

export function parseResultsBuffer(
  buf: ArrayBuffer | Buffer,
  filename: string
): ParsePreview {
  const errors: string[] = [];
  const warnings: string[] = [];
  let matrix: string[][] = [];

  const name = filename.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = Buffer.from(buf as ArrayBuffer).toString("utf8").replace(/^\uFEFF/, "");
    matrix = parseCsv(text);
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(buf, { type: "buffer", cellText: true, cellDates: false });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as string[][];
    matrix = raw.map((r) => r.map((c) => String(c ?? "")));
  } else {
    return {
      ok: false,
      rows: [],
      errors: ["Format non supporté. Utilisez .csv ou .xlsx."],
      warnings: [],
      total: 0,
      finishers: 0,
      duplicates: [],
    };
  }

  if (!matrix.length) {
    return {
      ok: false,
      rows: [],
      errors: ["Fichier vide."],
      warnings: [],
      total: 0,
      finishers: 0,
      duplicates: [],
    };
  }

  const header = matrix[0].map((h) => String(h).trim());
  for (const h of header) {
    if (isForbiddenHeader(h)) {
      errors.push(`Colonne interdite détectée : « ${h} ».`);
    }
  }
  // also scan extra columns beyond required
  for (let i = REQUIRED_HEADERS.length; i < header.length; i++) {
    if (header[i] && isForbiddenHeader(header[i])) {
      errors.push(`Colonne interdite : « ${header[i]} ».`);
    }
  }

  if (!headerMatches(header, REQUIRED_HEADERS)) {
    errors.push(
      `En-tête incorrect. Attendu exactement : ${REQUIRED_HEADERS.join(";")}`
    );
  }

  if (errors.length) {
    return {
      ok: false,
      rows: [],
      errors,
      warnings,
      total: 0,
      finishers: 0,
      duplicates: [],
    };
  }

  const rows: ResultRow[] = [];
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line || line.every((c) => !String(c).trim())) continue;
    const get = (i: number) => sanitizeField(line[i] ?? "", 120);

    const statutRaw = get(8).toUpperCase().replace(/\s+/g, "_");
    if (!(ALLOWED_STATUTS as readonly string[]).includes(statutRaw)) {
      errors.push(`Ligne ${r + 1}: statut invalide « ${get(8)} ».`);
      continue;
    }
    const statut = statutRaw as StatutCert;
    let temps = get(9);
    let cs = get(10);
    let cg = get(11);
    let cc = get(12);
    if (statut !== "FINISHER") {
      cs = "";
      cg = "";
      cc = "";
      if (!temps) temps = "";
    }
    if (temps && !isValidTemps(temps)) {
      errors.push(`Ligne ${r + 1}: temps invalide « ${temps} » (hh:mm:ss).`);
      continue;
    }

    const course = get(1);
    const dossard = normalizeDossard(get(2));
    const nom = get(4);
    if (!course || !dossard || !nom) {
      errors.push(`Ligne ${r + 1}: course, dossard ou nom manquant.`);
      continue;
    }
    const key = `${course}||${dossard}`;
    if (seen.has(key)) {
      duplicates.push(`${course} / dossard ${dossard} (lignes ${seen.get(key)} et ${r + 1})`);
    } else seen.set(key, r + 1);

    rows.push({
      edition: get(0),
      course,
      dossard,
      prenom: get(3),
      nom,
      nom_norm: normalizeNom(nom),
      genre: get(5),
      categorie: get(6),
      nationalite: get(7),
      statut,
      temps,
      classement_scratch: cs,
      classement_genre: cg,
      classement_categorie: cc,
    });
  }

  if (duplicates.length) {
    errors.push(`Doublons dossard dans une même course : ${duplicates.join(" ; ")}`);
  }

  const finishers = rows.filter((x) => x.statut === "FINISHER").length;
  return {
    ok: errors.length === 0,
    rows,
    errors,
    warnings,
    total: rows.length,
    finishers,
    duplicates,
  };
}
