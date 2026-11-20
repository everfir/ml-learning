import { drawFruit, examples, type Fruit } from "./gift-order.ts";
export const training: Fruit[] = [
  ...examples,
  { id: "D", size: 4, color: 6 },
  { id: "E", size: 1, color: 4 },
  { id: "F", size: 7, color: 4 },
  { id: "G", size: 8, color: 9 },
  { id: "H", size: 3, color: 1 },
  { id: "I", size: 6, color: 8 },
  { id: "J", size: 5, color: 9 },
  { id: "K", size: 7, color: 10 },
  { id: "L", size: 10, color: 9 },
];
export const auditSize = 100;
export const drawAudit = (seed: number) =>
  drawFruit(seed, training, auditSize, "M").map((f, i) => ({ ...f, id: String(i + 1) }));
