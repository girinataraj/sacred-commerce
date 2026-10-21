import 'server-only';
// Pinned Prisma7/pg adapter represents SQLSTATE40001/40P01 as P2034 or
// P2010 raw-query metadata. Do not classify arbitrary/ambiguous DB failures.
export function isSerializationConflict(error:unknown):boolean {
  if(!error||typeof error!=='object')return false;
  const value=error as {code?:string;meta?:{code?:string;driverAdapterError?:{cause?:{kind?:string}}}};
  return value.code==='P2034'||(value.code==='P2010'&&(['40001','40P01'].includes(value.meta?.code??'')||value.meta?.driverAdapterError?.cause?.kind==='TransactionWriteConflict'));
}
