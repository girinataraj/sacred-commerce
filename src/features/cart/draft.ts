export function parseQuantityDraft(value:string,stock:number):number|null {
  if(!/^\d{1,2}$/.test(value))return null;
  const quantity=Number(value);
  return Number.isInteger(stock)&&quantity>=1&&quantity<=Math.min(10,stock)?quantity:null;
}
