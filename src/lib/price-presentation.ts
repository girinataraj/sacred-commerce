const inr=new Intl.NumberFormat('en-IN',{ style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2 });
const fractionalInr=new Intl.NumberFormat('en-IN',{ style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2 });
const format=(paise:number) => (paise%100===0 ? inr : fractionalInr).format(paise/100);
const valid=(value: number) => Number.isSafeInteger(value) && value>0 && value<=10000000;
export function presentPrice(price: number, reference: number | null) {
  if (!valid(price)) return null;
  const comparison=reference!==null && valid(reference) && reference>price ? reference : null;
  return { selling:format(price),reference:comparison ? format(comparison) : null,saving:comparison ? format(comparison-price) : null,percent:comparison ? Math.floor((comparison-price)*100/comparison) : null };
}
