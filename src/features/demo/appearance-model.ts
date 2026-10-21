export type Appearance = 'light' | 'twilight';
export const appearanceKey = 'sacred-commerce-appearance-v1';
export function normalizeAppearance(value: unknown): Appearance {
  return value === 'twilight' ? 'twilight' : 'light';
}
// Static first-paint bootstrap. Only a validated enum reaches the DOM; no user
// string is evaluated or inserted into markup. Storage can be unavailable.
export const appearanceBootstrap = `try{document.documentElement.dataset.demoTheme=localStorage.getItem('${appearanceKey}')==='twilight'?'twilight':'light'}catch{document.documentElement.dataset.demoTheme='light'}`;
// The stable stored `twilight` value now selects the approved Moonlight identity.
