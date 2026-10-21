export function cartAmounts(lines: readonly {pricePaise:number;quantity:number}[]) {
  const subtotalPaise=lines.reduce((sum,line)=>sum+line.pricePaise*line.quantity,0);
  return {subtotalPaise,shippingPaise:0,taxPaise:0,totalPaise:subtotalPaise,currency:'INR' as const};
}
