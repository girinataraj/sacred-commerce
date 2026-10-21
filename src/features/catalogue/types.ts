// Shared transport shape only. T03 owns database hydration/query services.
// ProductCard receives supplied records and never queries or invents facts.
export type ProductDTO = Readonly<{
  id: string; slug: string; name: string; description: string;
  category: Readonly<{ id: string; slug: string; name: string }>;
  pricePaise: number; compareAtPricePaise: number | null; stock: number;
  version: number; active: boolean; featured: boolean;
  imagePath: string; imageAlt: string;
  material: string; dimensions: string; care: string; includedContents: string;
  occasionTags: readonly string[]; intentTags: readonly string[];
  collectionSlugs: readonly string[]; savingsPaise: number | null; savingsPercent: number | null;
  availability: string;
}>;
export type CategoryDTO = Readonly<{ id:string; slug:string; name:string; productCount:number }>;
export type ProductPage = Readonly<{ items:readonly ProductDTO[]; total:number; page:number; pageSize:number; pageCount:number }>;
export type FilterMetadata = Readonly<{ occasions:readonly string[]; intents:readonly string[] }>;
