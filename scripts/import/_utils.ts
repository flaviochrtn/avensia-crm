/**
 * scripts/import/_utils.ts
 * Utilitaires partagés entre tous les scripts d'import.
 */

import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function readCsv<T = Record<string, string>>(filePath: string): T[] {
  const raw = fs.readFileSync(path.resolve(filePath), "utf-8")
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[]
}

// ─── CONVERSIONS ──────────────────────────────────────────────────────────────

/** "True"/"False"/"" → boolean | null */
export function parseBool(val: string): boolean | null {
  if (val === "True" || val === "true" || val === "1") return true
  if (val === "False" || val === "false" || val === "0") return false
  return null
}

/** "2024-05-12" | "" → Date | null */
export function parseDate(val: string): Date | null {
  if (!val || val.trim() === "") return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

/** "" → null, sinon la valeur trimée */
export function str(val: string | undefined): string | null {
  if (val === undefined || val === null) return null
  const t = val.trim()
  return t === "" ? null : t
}

/** Coerce un entier ou retourne 0 */
export function int(val: string, fallback = 0): number {
  const n = parseInt(val, 10)
  return isNaN(n) ? fallback : n
}

// ─── LOGGER ───────────────────────────────────────────────────────────────────

export type LogEntry = {
  status: "ok" | "skip" | "error" | "warn"
  ref: string
  message?: string
}

export class ImportLogger {
  private entries: LogEntry[] = []
  private label: string

  constructor(label: string) {
    this.label = label
    console.log(`\n▶ Import : ${label}`)
    console.log("─".repeat(50))
  }

  ok(ref: string, msg?: string) {
    this.entries.push({ status: "ok", ref, message: msg })
    console.log(`  ✓  ${ref}${msg ? " — " + msg : ""}`)
  }

  skip(ref: string, msg: string) {
    this.entries.push({ status: "skip", ref, message: msg })
    console.log(`  ~  ${ref} — ${msg}`)
  }

  warn(ref: string, msg: string) {
    this.entries.push({ status: "warn", ref, message: msg })
    console.warn(`  ⚠  ${ref} — ${msg}`)
  }

  error(ref: string, msg: string) {
    this.entries.push({ status: "error", ref, message: msg })
    console.error(`  ✗  ${ref} — ${msg}`)
  }

  summary() {
    const ok    = this.entries.filter((e) => e.status === "ok").length
    const skip  = this.entries.filter((e) => e.status === "skip").length
    const warn  = this.entries.filter((e) => e.status === "warn").length
    const error = this.entries.filter((e) => e.status === "error").length

    console.log("\n" + "─".repeat(50))
    console.log(`Résumé — ${this.label}`)
    console.log(`  ✓ créés/mis à jour : ${ok}`)
    console.log(`  ~ ignorés (déjà présents) : ${skip}`)
    if (warn)  console.warn(`  ⚠ avertissements : ${warn}`)
    if (error) console.error(`  ✗ erreurs : ${error}`)

    if (error > 0) {
      console.error("\nDétail des erreurs :")
      this.entries
        .filter((e) => e.status === "error")
        .forEach((e) => console.error(`    ✗ ${e.ref} — ${e.message}`))
    }

    if (warn > 0) {
      console.warn("\nDétail des avertissements :")
      this.entries
        .filter((e) => e.status === "warn")
        .forEach((e) => console.warn(`    ⚠ ${e.ref} — ${e.message}`))
    }

    return { ok, skip, warn, error }
  }
}
