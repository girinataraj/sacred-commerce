import { parseCatalogueQuery,CatalogueQueryError,type QueryInput,type CatalogueQuery } from '../catalogue/schemas';
export function collectionQuery(slug:string,input:QueryInput):CatalogueQuery {
  const parsed=parseCatalogueQuery(input);
  if(parsed.collection && parsed.collection!==slug) throw new CatalogueQueryError({collection:'Keep this collection selected.'});
  return parseCatalogueQuery({...Object.fromEntries(Object.entries(parsed).map(([key,value])=>[key,String(value)])),collection:slug});
}
