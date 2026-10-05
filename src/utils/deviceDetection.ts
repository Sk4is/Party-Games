/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robust PC / Desktop device detection for FAM2PLAY.
 * Complies with Dark Protocol requirements:
 * - Detects pointer capability (fine vs coarse)
 * - Detects hover capability
 * - Detects User-Agent hints without classifying narrow laptops as mobile
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  // 1. Check for standard fine pointer & hover (Mouse / Trackpad)
  const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
  const hasHover = window.matchMedia?.('(hover: hover)').matches ?? false;
  const isCoarseOnly = window.matchMedia?.('(pointer: coarse) and not (pointer: fine)').matches ?? false;

  // 2. User-Agent heuristics for phones and tablets
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // If running on an explicit mobile/tablet OS without a primary fine mouse pointer
  if (isMobileUA && !hasFinePointer) {
    return false;
  }

  // If touch-only device (no hover and coarse pointer only)
  if (isCoarseOnly && !hasHover) {
    return false;
  }

  // Laptops with touchscreens (have both fine pointer and touch) are accepted as desktop
  return true;
}
