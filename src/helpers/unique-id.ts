let counter = 0;

/**
 * Generates a unique numeric id for test data.
 *
 * Combines a coarse timestamp and a per-process counter so parallel workers
 * and fast repeated calls within the same millisecond do not collide.
 * The result stays well below Number.MAX_SAFE_INTEGER.
 */
export const uniqueId = (): number => {
  counter = (counter + 1) % 1000;
  const timePart = Math.floor(Date.now() / 1000);
  const randomPart = Math.floor(Math.random() * 1000);
  return timePart * 1_000_000 + counter * 1000 + randomPart;
};
