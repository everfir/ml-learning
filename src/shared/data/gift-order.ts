export type Fruit = { id: string; size: number; color: number };
export const examples: Fruit[] = [
  { id: "A", size: 2, color: 8 },
  { id: "B", size: 8, color: 2 },
  { id: "C", size: 5, color: 5 },
];
export const orderGap = 3;
export const ordered = (f: Fruit) => Math.abs(f.color - f.size) >= orderGap;
export const box = (gift: boolean) => (gift ? "礼盒" : "散装");

export const grid = Array.from({ length: 121 }, (_, i) => ({
  size: Math.floor(i / 11),
  color: i % 11,
  id: "",
}));

// Draw without replacement in the original grid order so saved seeds remain reproducible.
export function drawFruit(
  seed: number,
  excluded: Fruit[],
  count: number,
  firstId: string,
): Fruit[] {
  const pool = grid.filter((p) => !excluded.some((f) => p.size === f.size && p.color === f.color));
  let state = seed;
  return Array.from({ length: count }, (_, i) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const [f] = pool.splice(Math.floor((state / 2 ** 32) * pool.length), 1);
    return { ...f, id: String.fromCharCode(firstId.charCodeAt(0) + i) };
  });
}
