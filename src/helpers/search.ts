import { sql, like, or, SQL } from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

/** Columns used for marketplace-style product ranking (title matches first). */
export type ProductSearchRankColumns = {
  title: MySqlColumn;
  description: MySqlColumn;
  city: MySqlColumn;
  address: MySqlColumn;
};

/**
 * Higher score = better match. Title matches dominate, then description, then location fields.
 * Sums over each search word so multi-word queries prefer rows that match more terms in the title.
 */
export function buildProductSearchRelevanceScore(
  cols: ProductSearchRankColumns,
  words: string[]
): SQL {
  if (words.length === 0) return sql`0`;
  const parts: SQL[] = [];
  for (const w of words) {
    const p = `%${w}%`;
    parts.push(sql`(CASE WHEN ${cols.title} LIKE ${p} THEN 100 ELSE 0 END)`);
    parts.push(sql`(CASE WHEN ${cols.description} LIKE ${p} THEN 10 ELSE 0 END)`);
    parts.push(sql`(CASE WHEN ${cols.city} LIKE ${p} THEN 2 ELSE 0 END)`);
    parts.push(sql`(CASE WHEN ${cols.address} LIKE ${p} THEN 2 ELSE 0 END)`);
  }
  return sql`(${sql.join(parts, sql` + `)})`;
}

/**
 * Builds a fuzzy search condition for a single column.
 * Matches the search word against:
 *   1. The raw column value (standard LIKE)
 *   2. A stripped version of the column (no spaces, parens, hyphens, slashes, dots)
 *      so "AC" matches "conditioning(AC)", "1hpAC", "A/C", "A.C", "A-C", etc.
 */
function fuzzyMatch(column: MySqlColumn, word: string): SQL {
  const cleanedWord = word.replace(/[^a-zA-Z0-9]/g, "");

  return or(
    like(column, `%${word}%`),
    sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, ' ', ''), '(', ''), ')', ''), '-', ''), '/', ''), '.', '') LIKE ${`%${cleanedWord}%`}`
  )!;
}

/**
 * Builds a search filter across multiple columns for a search string.
 * Splits the search into words, and for each word matches fuzzily against all columns.
 * Words are OR'd together (any word can match any column).
 */
export function buildSearchFilter(
  searchTerm: string,
  columns: MySqlColumn[]
): SQL | undefined {
  const words = searchTerm.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;

  const wordConditions = words.map((word) => {
    const columnMatches = columns.map((col) => fuzzyMatch(col, word));
    return or(...columnMatches);
  });

  return or(...wordConditions);
}
