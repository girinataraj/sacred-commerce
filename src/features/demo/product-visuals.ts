export type ProductVisual = Readonly<{
  src: `/products/${string}.webp`;
  description: string;
}>;

/** Original demo artwork only; independent of database catalogue records. */
export const demoProductVisuals = {
  'clay-festival-lamp': { src: '/products/clay-festival-lamp.webp', description: 'A shallow terracotta oil lamp with a pinched spout and an unlit cotton wick.' },
  'brass-table-bell': { src: '/products/brass-table-bell.webp', description: 'An upright golden brass handbell with a turned handle and flared base.' },
  'cotton-wick-spool': { src: '/products/cotton-wick-spool.webp', description: 'Ivory cotton wick wound around a wooden spool with a loose curling strand.' },
  'brass-wick-spoon': { src: '/products/brass-wick-spoon.webp', description: 'A slender brass spoon with a shallow oval bowl and tapered handle.' },
  'terracotta-incense-stand': { src: '/products/terracotta-incense-stand.webp', description: 'An elongated clay incense tray with rounded corners and a raised holder at one end.' },
  'cotton-everyday-pouch': { src: '/products/cotton-everyday-pouch.webp', description: 'A natural cotton pouch with a gathered opening and braided drawstrings.' },
  'forest-cotton-stole': { src: '/products/forest-cotton-stole.webp', description: 'A deep green woven cotton stole draped in soft folds with fringed ends.' },
  'neem-wood-comb': { src: '/products/neem-wood-comb.webp', description: 'A golden neem-wood comb with a curved back, wide teeth and visible grain.' },
  'cotton-seating-mat': { src: '/products/cotton-seating-mat.webp', description: 'A flat ivory woven seating mat edged in forest green with corner tassels.' },
  'reusable-cotton-gift-wrap': { src: '/products/reusable-cotton-gift-wrap.webp', description: 'Botanical-print cotton cloth tied around a square gift with a fabric knot.' },
  'handcrafted-ceramic-bowl': { src: '/products/handcrafted-ceramic-bowl.webp', description: 'A round speckled ivory ceramic bowl with an irregular rim and glossy green interior.' },
  'woven-table-runner': { src: '/products/woven-table-runner.webp', description: 'A partially rolled natural cotton table runner with green woven stripes and fringe.' },
  'terracotta-bud-vase': { src: '/products/terracotta-bud-vase.webp', description: 'A wheel-thrown terracotta vase with a rounded body, narrow neck and open lip.' },
  'brass-tea-light-holder': { src: '/products/brass-tea-light-holder.webp', description: 'An empty circular brass tea-light cup on a low pedestal foot.' },
  'cotton-cushion-cover': { src: '/products/cotton-cushion-cover.webp', description: 'A square green-and-cream cotton cover with stitched leaves and a folded open corner.' },
  'quiet-moments-journal': { src: '/products/quiet-moments-journal.webp', description: 'A closed forest-green cloth journal with a small embossed sun and cream ribbon.' },
  'seasons-sketchbook': { src: '/products/seasons-sketchbook.webp', description: 'An open spiral sketchbook showing blank textured pages above a terracotta cover.' },
  'everyday-notes-notebook': { src: '/products/everyday-notes-notebook.webp', description: 'A kraft notebook with a green stitched spine, opened to show ruled pages.' },
  'handmade-paper-bookmark': { src: '/products/handmade-paper-bookmark.webp', description: 'A deckle-edge paper bookmark with a fern illustration and terracotta tassel.' },
  'botanical-art-postcard-pack': { src: '/products/botanical-art-postcard-pack.webp', description: 'Five fanned ivory postcards with fern, olive, eucalyptus, ginkgo and wildflower artwork.' },
} as const satisfies Record<string, ProductVisual>;

export type DemoProductSlug = keyof typeof demoProductVisuals;

export function getProductVisual(slug: string): ProductVisual {
  const visual = demoProductVisuals[slug as DemoProductSlug];
  if (!visual) throw new Error(`Missing demo product artwork: ${slug}`);
  return visual;
}

export function productImageAlt(name: string, visual: ProductVisual): string {
  return `Original demo illustration for ${name}: ${visual.description}`;
}
