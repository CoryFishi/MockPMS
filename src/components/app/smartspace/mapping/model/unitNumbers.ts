// Unit-number sequencing for the row-of-doors tool: "A101" → "A102",
// "A009" → "A010" (padding kept), "B" → "B1".

export function nextUnit(unit: string, step = 1): string {
  const match = /^(.*?)(\d+)(\D*)$/.exec(unit);
  if (!match) return `${unit}${step}`;
  const [, prefix, digits, suffix] = match;
  const next = Math.max(0, parseInt(digits, 10) + step);
  return `${prefix}${String(next).padStart(digits.length, "0")}${suffix}`;
}

export function unitSequence(first: string, count: number, step = 1): string[] {
  const units: string[] = [];
  let unit = first;
  for (let i = 0; i < count; i++) {
    units.push(unit);
    unit = nextUnit(unit, step);
  }
  return units;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function naturalCompare(a: string, b: string): number {
  return collator.compare(a, b);
}
