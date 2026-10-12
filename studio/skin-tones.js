/** Monk, Ellis. “Monk Skin Tone Scale,” 2019. CC BY 4.0.
 * Exact reference colors; rendered skin is an adaptation, not a measured match. */
export const SKIN_SOURCE = 'https://skintone.google/get-started';
export const SKIN_LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
export const SKIN_ATTRIBUTION = 'Monk, Ellis. “Monk Skin Tone Scale,” 2019. https://skintone.google. Licensed under Creative Commons Attribution 4.0 International. Rendered skin and custom colors are adaptations.';
export const SKIN_TONES = Object.freeze([
  ['monk01', 'Monk 01', '#f6ede4'], ['monk02', 'Monk 02', '#f3e7db'],
  ['monk03', 'Monk 03', '#f7ead0'], ['monk04', 'Monk 04', '#eadaba'],
  ['monk05', 'Monk 05', '#d7bd96'], ['monk06', 'Monk 06', '#a07e56'],
  ['monk07', 'Monk 07', '#825c43'], ['monk08', 'Monk 08', '#604134'],
  ['monk09', 'Monk 09', '#3a312a'], ['monk10', 'Monk 10', '#292420'],
].map(([id, label, color]) => Object.freeze({id, label, color})));
export const LEGACY_SKIN_COLORS = Object.freeze({light:'#fffaf5', medium:'#e0c1ad', tan:'#b58b6f', dark:'#755644'});
const colors = new Map(SKIN_TONES.map(tone => [tone.id, tone.color]));
const hex = /^#[0-9a-fA-F]{6}$/;
/** Resolve a body choice without inspecting anatomy or mutating saved state. */
export function skinColor(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return LEGACY_SKIN_COLORS.medium;
  if (body.skin === 'custom') return typeof body.skinColor === 'string' && hex.test(body.skinColor) ? body.skinColor : LEGACY_SKIN_COLORS.medium;
  return colors.get(body.skin) || (Object.hasOwn(LEGACY_SKIN_COLORS, body.skin) ? LEGACY_SKIN_COLORS[body.skin] : LEGACY_SKIN_COLORS.medium);
}
