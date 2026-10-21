export type SeedProduct = {
  slug: string; name: string; categorySlug: string; pricePaise: number;
  compareAtPricePaise: number | null; stock: number; seasonal: boolean;
  material: string; dimensions: string; care: string; includedContents: string;
  description: string; occasionTags: string[]; intentTags: string[];
};

type OriginalRecord = [string, string, number, number | null, number, boolean, string, string, string, string[]];
const records: OriginalRecord[] = [
  ['Clay Festival Lamp','ritual-essentials',19900,null,25,true,'Terracotta','9 × 9 × 4 cm','One lamp',['ritual','gifting']],
  ['Brass Table Bell','ritual-essentials',79900,null,1,true,'Brass','12 cm high','One bell',['ritual','gifting']],
  ['Cotton Wick Spool','ritual-essentials',12900,null,40,true,'Cotton','5 m spool','One spool',['ritual']],
  ['Brass Wick Spoon','ritual-essentials',24900,null,0,true,'Brass','14 cm long','One spoon',['ritual']],
  ['Terracotta Incense Stand','ritual-essentials',39900,49900,15,true,'Terracotta','11 × 6 cm','One stand',['ritual','home']],
  ['Cotton Everyday Pouch','natural-living',34900,null,20,true,'Cotton','18 × 14 cm','One pouch',['gifting','self_care']],
  ['Forest Cotton Stole','natural-living',80000,100000,18,true,'Cotton','180 × 60 cm','One stole',['gifting','self_care']],
  ['Neem Wood Comb','natural-living',29900,null,16,false,'Neem wood','16 × 5 cm','One comb',['self_care']],
  ['Cotton Seating Mat','natural-living',119900,null,12,false,'Cotton','60 × 60 cm','One mat',['home','self_care']],
  ['Reusable Cotton Gift Wrap','natural-living',24900,null,22,true,'Cotton','60 × 60 cm','One cloth wrap',['gifting']],
  ['Handcrafted Ceramic Bowl','home-craft',59900,69900,14,true,'Ceramic','14 cm diameter','One bowl',['home','gifting']],
  ['Woven Table Runner','home-craft',149900,null,8,true,'Cotton','150 × 35 cm','One runner',['home','gifting']],
  ['Terracotta Bud Vase','home-craft',69900,89900,10,true,'Terracotta','16 cm high','One vase',['home','gifting']],
  ['Brass Tea-Light Holder','home-craft',89900,null,9,true,'Brass','8 cm diameter','One holder; candle not included',['home','ritual']],
  ['Cotton Cushion Cover','home-craft',79900,null,11,false,'Cotton','40 × 40 cm','One cover; insert not included',['home']],
  ['Quiet Moments Journal','books-gifts',44900,null,24,true,'Paper and card','A5; 160 blank pages','One journal',['reading','gifting']],
  ['Seasons Sketchbook','books-gifts',39900,null,21,false,'Paper and card','A5; 80 blank pages','One sketchbook',['reading']],
  ['Everyday Notes Notebook','books-gifts',24900,null,28,false,'Paper and card','A5; 120 ruled pages','One notebook',['reading']],
  ['Handmade Paper Bookmark','books-gifts',14900,null,35,false,'Paper','15 × 4 cm','One bookmark',['reading','gifting']],
  ['Botanical Art Postcard Pack','books-gifts',29900,null,19,false,'Paper','A6; 5 original demo designs','Five postcards',['gifting','reading']],
];

export const catalogueSeed: SeedProduct[] = records.map(([name, categorySlug, pricePaise, compareAtPricePaise, stock, seasonal, material, dimensions, includedContents, intentTags]) => ({
  name, categorySlug, pricePaise, compareAtPricePaise, stock, seasonal, material, dimensions, includedContents, intentTags,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  occasionTags: seasonal ? ['navratri','everyday'] : categorySlug === 'home-craft' ? ['housewarming','everyday'] : ['everyday'],
  care: material === 'Cotton' ? 'For this fictional demo item, gently hand-wash in cool water and air-dry.' : 'For this fictional demo item, keep dry and wipe gently with a soft cloth.',
  description: `${name} is an original fictional catalogue item for the Sacred Commerce interview demo. ${includedContents}. Material: ${material}. Size: ${dimensions}. No actual product is supplied.`,
}));
