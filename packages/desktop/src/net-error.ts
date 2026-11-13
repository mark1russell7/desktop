/**
 * The Chromium net error codes of a failed load, and the reason of each failure.
 *
 * @packageDocumentation
 */

/** The Chromium net error codes that `failureOf` reads. The event `did-fail-load` gives them. */
export const NET_ERRORS = {
  ABORTED: -3,
  TIMED_OUT: -7,
  ACCESS_DENIED: -10,
  BLOCKED_BY_CLIENT: -20,
  BLOCKED_BY_RESPONSE: -27,
  CONNECTION_REFUSED: -102,
  CONNECTION_TIMED_OUT: -118,
} as const;

/**
 * The reason of a failed load. `timeout`: no page in the time limit. `refused`: the site, the network or a rule refused
 * the load. `network`: a different fault, for example no name, no route or a bad certificate.
 */
export type LoadFailure = "timeout" | "refused" | "network";

/**
 * This function gives the reason of a failed load from its Chromium error code. The code `-3` (`ERR_ABORTED`) is a load
 * that a new load replaced, so it gives `undefined`.
 *
 * @param code - The error code of `did-fail-load`.
 */
export function failureOf(code: number): LoadFailure | undefined {
  switch (code) {
    case NET_ERRORS.ABORTED:
      return undefined;
    case NET_ERRORS.TIMED_OUT:
    case NET_ERRORS.CONNECTION_TIMED_OUT:
      return "timeout";
    case NET_ERRORS.ACCESS_DENIED:
    case NET_ERRORS.BLOCKED_BY_CLIENT:
    case NET_ERRORS.BLOCKED_BY_RESPONSE:
    case NET_ERRORS.CONNECTION_REFUSED:
      return "refused";
    default:
      return "network";
  }
}
