/**
 * The rule of the keys between a view of a site and the page of the app.
 *
 * @packageDocumentation
 */

/** The fields of a key press of Electron (`before-input-event`) that `returnsKeys` reads. */
export interface KeyInput {
  readonly type: string;
  readonly key: string;
  readonly control: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

/**
 * This function tells if a key press in the view of a site gives the keys back to the app. A click on a site gives
 * the keys to the site, and `Escape` with no modifier key gives them back.
 */
export function returnsKeys(input: KeyInput): boolean {
  return input.type === "keyDown" && input.key === "Escape" && !input.control && !input.alt && !input.meta;
}
