/**
 * Build a GitHub-style activity heatmap from progress-update timestamps.
 * Returns `weeks` columns (oldest→newest), each a 7-day column (Sun→Sat),
 * with an intensity level 0–4 based on how many updates happened that day.
 */
export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function buildHeatmap(
  timestamps: Date[],
  now: Date,
  weeks = 13
): { columns: HeatmapCell[][]; total: number } {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = ts.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Find the most recent Saturday (end of the current week column).
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfWeek = new Date(end);
  endOfWeek.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const totalDays = weeks * 7;
  const start = new Date(endOfWeek);
  start.setUTCDate(endOfWeek.getUTCDate() - (totalDays - 1));

  const columns: HeatmapCell[][] = [];
  let total = 0;
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      const count = counts.get(key) ?? 0;
      total += count;
      col.push({
        date: key,
        count,
        level: levelFor(count),
        future: cursor.getTime() > end.getTime(),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    columns.push(col);
  }
  return { columns, total };
}
