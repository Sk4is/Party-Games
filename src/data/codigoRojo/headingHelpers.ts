/**
 * Circular heading / azimuth calculation helpers.
 * In aviation and marine compasses, headings wrap seamlessly:
 * ... 358° -> 359° -> 0° -> 1° ...
 * 359° + 15° = 14°
 * 5° - 15° = 350°
 */

/**
 * Wraps any angle in degrees into the canonical compass range [0, 359].
 * Examples:
 *   wrapHeading(374) === 14
 *   wrapHeading(-10) === 350
 *   wrapHeading(360) === 0
 *   wrapHeading(359) === 359
 */
export function wrapHeading(degrees: number): number {
  return ((Math.round(degrees) % 360) + 360) % 360;
}

/**
 * Calculates the shortest angular distance between two headings along the circle [0, 360).
 * Examples:
 *   circularHeadingDistance(359, 0) === 1
 *   circularHeadingDistance(358, 1) === 3
 *   circularHeadingDistance(359, 1) === 2
 *   circularHeadingDistance(357, 359) === 2
 */
export function circularHeadingDistance(a: number, b: number): number {
  const normA = wrapHeading(a);
  const normB = wrapHeading(b);
  const diff = Math.abs(normA - normB);
  return Math.min(diff, 360 - diff);
}
