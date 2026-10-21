import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, afterEach, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { createIdentityService, type Actor } from '../../src/lib/server/identity-core';
import { getCart, addCartItem, setCartQuantity, removeCartItem, clearCart } from '../../src/features/cart/service';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_APP_DATABASE_URL!,max:4})});
const owner=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_DATABASE_URL!,max:4})});
const ids=[randomUUID(),randomUUID()];
let actor:Actor, other:Actor;
let pouch:string, lamp:string, stole:string, spoon:string, bell:string;
const identity=(id:string)=>createIdentityService(async()=>({data:{user:{id}},error:null}),db).requireActor();
beforeAll(async()=>{
  for (const id of ids) await owner.$executeRaw`INSERT INTO auth.users(id) VALUES(${id}::uuid)`;
  [actor,other]=await Promise.all(ids.map(identity));
  const products=await db.product.findMany();
  const id=(slug:string)=>products.find(p=>p.slug===slug)!.id;
  pouch=id('cotton-everyday-pouch'); lamp=id('clay-festival-lamp'); stole=id('forest-cotton-stole'); spoon=id('brass-wick-spoon'); bell=id('brass-table-bell');
});
beforeEach(async()=>{
  await owner.cartItem.deleteMany({where:{cart:{userId:{in:ids}}}});
  await owner.cart.deleteMany({where:{userId:{in:ids}}});
});
afterEach(async()=>{
  await owner.product.update({where:{id:pouch},data:{active:true,stock:20,pricePaise:34900}});
});
afterAll(async()=>{
  await owner.cartItem.deleteMany({where:{cart:{userId:{in:ids}}}}); await owner.cart.deleteMany({where:{userId:{in:ids}}});
  await owner.profile.deleteMany({where:{id:{in:ids}}});
  for (const id of ids) await owner.$executeRaw`DELETE FROM auth.users WHERE id=${id}::uuid`;
  await db.$disconnect(); await owner.$disconnect();
});
it('creates a single empty own cart and retrieves its stable ID without advancing revision',async()=>{
  const cart=await getCart(actor,db); expect(cart).toMatchObject({revision:0,items:[],subtotalPaise:0,totalPaise:0,currency:'INR'});
  expect(await getCart(actor,db)).toEqual(cart); expect(await db.cart.count({where:{userId:actor.userId}})).toBe(1);
  expect(cart).not.toHaveProperty('userId');
});
it('adds an active available product with actual facts and no stock reservation',async()=>{
  const cart=await addCartItem(actor,{productId:pouch,quantity:2,expectedRevision:0},db);
  expect(cart).toMatchObject({revision:1,totalPaise:69800});
  expect(cart.items).toHaveLength(1); expect(cart.items[0]).toMatchObject({productId:pouch,quantity:2,unitPricePaise:34900,lineTotalPaise:69800,availability:'AVAILABLE',canPurchase:true});
  expect((await db.product.findUniqueOrThrow({where:{id:pouch}})).stock).toBe(20);
});
it('repeated add increments the existing line while PATCH replaces the absolute quantity',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:2,expectedRevision:0},db);
  const merged=await addCartItem(actor,{productId:pouch,quantity:3,expectedRevision:1},db);
  expect(merged.items).toHaveLength(1); expect(merged.items[0].quantity).toBe(5);
  const patched=await setCartQuantity(actor,{productId:pouch,quantity:3,expectedRevision:2},db);
  expect(patched).toMatchObject({revision:3,totalPaise:104700}); expect(patched.items[0].quantity).toBe(3);
});
it('dedicated removal and clear mutate only when something changes',async()=>{
  let cart=await addCartItem(actor,{productId:pouch,quantity:2,expectedRevision:0},db);
  cart=await setCartQuantity(actor,{productId:pouch,quantity:2,expectedRevision:1},db); expect(cart.revision).toBe(1);
  cart=await removeCartItem(actor,{productId:lamp,expectedRevision:1},db); expect(cart.revision).toBe(1);
  cart=await removeCartItem(actor,{productId:pouch,expectedRevision:1},db); expect(cart).toMatchObject({revision:2,items:[],totalPaise:0});
  expect((await clearCart(actor,{expectedRevision:2},db)).revision).toBe(2);
  await addCartItem(actor,{productId:lamp,quantity:1,expectedRevision:2},db);
  expect(await clearCart(actor,{expectedRevision:3},db)).toMatchObject({revision:4,items:[],totalPaise:0});
});
it('persists across newly verified sessions and independent Prisma connections',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:3,expectedRevision:0},db);
  const second=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_APP_DATABASE_URL!})});
  try { expect(await getCart(await identity(actor.userId),second)).toMatchObject({revision:1,totalPaise:104700}); }
  finally { await second.$disconnect(); }
});
it.each([0,-1,1.5,'2',11,null,true])('rejects quantity %s at the service boundary without creating or modifying a cart',async quantity=>{
  await expect(addCartItem(actor,{productId:pouch,quantity,expectedRevision:0},db)).rejects.toMatchObject({status:422});
  expect(await db.cart.count({where:{userId:actor.userId}})).toBe(0);
  await addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0},db);
  await expect(setCartQuantity(actor,{productId:pouch,quantity,expectedRevision:1},db)).rejects.toMatchObject({status:422});
  expect(await getCart(actor,db)).toMatchObject({revision:1,totalPaise:34900});
});
it('rejects insufficient and merged excess stock with complete rollback',async()=>{
  await expect(addCartItem(actor,{productId:spoon,quantity:1,expectedRevision:0},db)).rejects.toMatchObject({status:409,code:'INSUFFICIENT_STOCK'});
  expect(await db.cart.count({where:{userId:actor.userId}})).toBe(0);
  await addCartItem(actor,{productId:bell,quantity:1,expectedRevision:0},db);
  await expect(addCartItem(actor,{productId:bell,quantity:1,expectedRevision:1},db)).rejects.toMatchObject({status:409,code:'INSUFFICIENT_STOCK'});
  await expect(setCartQuantity(actor,{productId:bell,quantity:2,expectedRevision:1},db)).rejects.toMatchObject({status:409});
  expect(await getCart(actor,db)).toMatchObject({revision:1,totalPaise:79900});
});
it('rejects merged quantity over ten without changing the existing line',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:6,expectedRevision:0},db);
  await expect(addCartItem(actor,{productId:pouch,quantity:5,expectedRevision:1},db)).rejects.toMatchObject({status:422});
  expect((await getCart(actor,db)).items[0].quantity).toBe(6);
});
it('rejects missing/inactive additions and missing PATCH lines',async()=>{
  await expect(addCartItem(actor,{productId:randomUUID(),quantity:1,expectedRevision:0},db)).rejects.toMatchObject({status:404});
  await owner.product.update({where:{id:pouch},data:{active:false}});
  await expect(addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0},db)).rejects.toMatchObject({status:409,code:'PRODUCT_UNAVAILABLE'});
  await expect(setCartQuantity(actor,{productId:lamp,quantity:1,expectedRevision:0},db)).rejects.toMatchObject({status:404});
  expect(await db.cart.count({where:{userId:actor.userId}})).toBe(0);
});
it('enforces twenty distinct lines but permits an increment on a full cart',async()=>{
  const template=await owner.product.findUniqueOrThrow({where:{id:pouch}});
  const added:string[]=[];
  try {
    for(let i=0;i<21;i++) { const id=randomUUID(); added.push(id); await owner.product.create({data:{...template,id,sku:`CART-${id}`,slug:`cart-${id}`,stock:50,compareAtPricePaise:null}}); }
    for(let i=0;i<20;i++) await addCartItem(actor,{productId:added[i],quantity:1,expectedRevision:i},db);
    await expect(addCartItem(actor,{productId:added[20],quantity:1,expectedRevision:20},db)).rejects.toMatchObject({status:409,code:'CART_LIMIT_REACHED'});
    const cart=await addCartItem(actor,{productId:added[0],quantity:1,expectedRevision:20},db); expect(cart.items).toHaveLength(20); expect(cart.revision).toBe(21);
  } finally { await owner.cartItem.deleteMany({where:{productId:{in:added}}}); await owner.product.deleteMany({where:{id:{in:added}}}); }
});
it('calculates ₹1,445 using actual seeded selling prices',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:3,expectedRevision:0},db);
  expect(await addCartItem(actor,{productId:lamp,quantity:2,expectedRevision:1},db)).toMatchObject({subtotalPaise:144500,totalPaise:144500,shippingPaise:0,taxPaise:0});
});
it('charges ₹1,600 for two seasonal stoles, without deducting their demo reference saving again',async()=>{
  const cart=await addCartItem(actor,{productId:stole,quantity:2,expectedRevision:0},db);
  expect(cart.totalPaise).toBe(160000); expect(cart.items[0]).toMatchObject({unitPricePaise:80000,compareAtPricePaise:100000,lineTotalPaise:160000});
});
it('reads changed selling prices and retains unavailable existing lines with explicit readiness',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:3,expectedRevision:0},db);
  await owner.product.update({where:{id:pouch},data:{pricePaise:35000,stock:2}});
  let cart=await getCart(actor,db); expect(cart).toMatchObject({revision:1,totalPaise:105000,canCheckout:false}); expect(cart.items[0]).toMatchObject({availability:'INSUFFICIENT_STOCK',canPurchase:false});
  await owner.product.update({where:{id:pouch},data:{stock:0}});
  cart=await getCart(actor,db); expect(cart.items[0].availability).toBe('OUT_OF_STOCK');
  await owner.product.update({where:{id:pouch},data:{active:false}});
  cart=await getCart(actor,db); expect(cart.items).toHaveLength(1); expect(cart.items[0].availability).toBe('INACTIVE');
  await expect(setCartQuantity(actor,{productId:pouch,quantity:1,expectedRevision:1},db)).rejects.toMatchObject({status:409});
  expect((await removeCartItem(actor,{productId:pouch,expectedRevision:1},db)).items).toEqual([]);
});
it('rejects stale revisions for every mutation including no-op requests',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0},db);
  for(const operation of [()=>addCartItem(actor,{productId:lamp,quantity:1,expectedRevision:0},db),()=>setCartQuantity(actor,{productId:pouch,quantity:1,expectedRevision:0},db),()=>removeCartItem(actor,{productId:lamp,expectedRevision:0},db),()=>clearCart(actor,{expectedRevision:0},db)]) await expect(operation()).rejects.toMatchObject({status:409,code:'CART_REVISION_CONFLICT'});
  expect((await getCart(actor,db)).revision).toBe(1);
});
it('denies forged actors and rejects ownership/role/price mass assignment',async()=>{
  await expect(getCart({userId:actor.userId,role:'ADMIN'},db)).rejects.toMatchObject({status:401});
  for(const extra of [{userId:other.userId},{cartId:randomUUID()},{role:'ADMIN'},{pricePaise:1},{actor:{userId:other.userId}}]) await expect(addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0,...extra},db)).rejects.toMatchObject({status:422});
  await addCartItem(other,{productId:lamp,quantity:2,expectedRevision:0},db);
  await expect(setCartQuantity(actor,{productId:lamp,quantity:1,expectedRevision:0},db)).rejects.toMatchObject({status:404});
  expect((await getCart(actor,db)).items).toEqual([]); expect(await getCart(other,db)).toMatchObject({revision:1,totalPaise:39800});
});
async function waitForBlocked(ownerClient:Client,count:number,applicationName:string) {
  const deadline=Date.now()+3000;
  do {
    await ownerClient.query('SELECT pg_stat_clear_snapshot()');
    const result=await ownerClient.query('SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type=\'Lock\'',[applicationName]);
    if(result.rows[0].n>=count) return;
    await new Promise(resolve=>setTimeout(resolve,20));
  } while(Date.now()<deadline);
  const diagnostics=await ownerClient.query('SELECT application_name,state,wait_event_type,wait_event FROM pg_stat_activity WHERE usename=\'commerce_test_login\'');
  throw new Error(`Expected ${count} actual blocked PostgreSQL sessions: ${JSON.stringify(diagnostics.rows)}`);
}
function raceClients(name:string) {
  return [0,1].map(()=>new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_APP_DATABASE_URL!,max:1,application_name:name})}));
}
it('serializes two genuinely overlapping quantity edits; one commits and one revision conflicts',async()=>{
  const cart=await addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0},db);
  const blocker=new Client({connectionString:process.env.TEST_DATABASE_URL!}); await blocker.connect();
  const clients=raceClients('t04-quantity-race'); let results:PromiseSettledResult<Awaited<ReturnType<typeof getCart>>>[]=[];
  try {
    await blocker.query('BEGIN'); await blocker.query('SELECT id FROM commerce."Cart" WHERE id=$1 FOR UPDATE',[cart.id]);
    const pending=Promise.allSettled(clients.map((client,index)=>setCartQuantity(actor,{productId:pouch,quantity:index+2,expectedRevision:1},client)));
    await waitForBlocked(blocker,2,'t04-quantity-race'); await blocker.query('COMMIT'); results=await pending;
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    const rejected=results.find(r=>r.status==='rejected'); expect(rejected?.status==='rejected'&&rejected.reason).toMatchObject({status:409,code:'CART_REVISION_CONFLICT'});
    const winner=results.find(r=>r.status==='fulfilled');
    const final=await getCart(actor,db); expect(final.revision).toBe(2); expect(final.items).toHaveLength(1);
    expect(final.items[0].quantity).toBe(winner?.status==='fulfilled'&&winner.value.items[0].quantity);
    expect((await db.product.findUniqueOrThrow({where:{id:pouch}})).stock).toBe(20);
  } finally {await blocker.query('ROLLBACK'); await blocker.end(); await Promise.all(clients.map(c=>c.$disconnect()));}
});
it('handles two blocked first-cart creations under the unique owner constraint',async()=>{
  const blocker=new Client({connectionString:process.env.TEST_DATABASE_URL!}); await blocker.connect();
  const clients=raceClients('t04-first-cart-race'); const cartId=randomUUID();
  try {
    await blocker.query('BEGIN'); await blocker.query('INSERT INTO commerce."Cart"(id,"userId","updatedAt") VALUES($1,$2,NOW())',[cartId,actor.userId]);
    const pending=Promise.allSettled(clients.map(client=>getCart(actor,client)));
    await waitForBlocked(blocker,2,'t04-first-cart-race'); await blocker.query('COMMIT');
    const results=await pending; expect(results.every(r=>r.status==='fulfilled')).toBe(true);
    for(const result of results) if(result.status==='fulfilled') expect(result.value).toMatchObject({id:cartId,revision:0,items:[]});
    expect(await db.cart.count({where:{userId:actor.userId}})).toBe(1);
  } finally {await blocker.query('ROLLBACK'); await blocker.end(); await Promise.all(clients.map(c=>c.$disconnect()));}
});
it('holds the cart before waiting for a product lock and rechecks stock after an administrator update',async()=>{
  const cart=await addCartItem(actor,{productId:pouch,quantity:1,expectedRevision:0},db);
  const blocker=new Client({connectionString:process.env.TEST_DATABASE_URL!}); await blocker.connect();
  const probe=new Client({connectionString:process.env.TEST_DATABASE_URL!}); await probe.connect();
  const [client,unused]=raceClients('t04-product-lock');
  try {
    await blocker.query('BEGIN'); await blocker.query('SELECT id FROM commerce."Product" WHERE id=$1 FOR UPDATE',[pouch]);
    const pending=Promise.allSettled([setCartQuantity(actor,{productId:pouch,quantity:2,expectedRevision:1},client)]);
    await waitForBlocked(blocker,1,'t04-product-lock');
    await expect(probe.query('SELECT id FROM commerce."Cart" WHERE id=$1 FOR UPDATE NOWAIT',[cart.id])).rejects.toMatchObject({code:'55P03'});
    await blocker.query('UPDATE commerce."Product" SET stock=0 WHERE id=$1',[pouch]); await blocker.query('COMMIT');
    const [result]=await pending; expect(result.status==='rejected'&&result.reason).toMatchObject({status:409,code:'INSUFFICIENT_STOCK'});
    const final=await getCart(actor,db); expect(final.revision).toBe(1); expect(final.items[0]).toMatchObject({quantity:1,stock:0,availability:'OUT_OF_STOCK'});
  } finally {await blocker.query('ROLLBACK'); await blocker.end(); await probe.end(); await client.$disconnect(); await unused.$disconnect();}
});
it('rolls back a line write and initial cart if the subsequent revision write fails in PostgreSQL',async()=>{
  // Test-only owner trigger, never a production failure hook or runtime grant.
  await owner.$executeRawUnsafe(`CREATE FUNCTION commerce.t04_fail_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic revision failure'; END $$`);
  await owner.$executeRawUnsafe(`CREATE TRIGGER t04_fail_revision BEFORE UPDATE ON commerce."Cart" FOR EACH ROW EXECUTE FUNCTION commerce.t04_fail_revision()`);
  try {
    await expect(addCartItem(actor,{productId:pouch,quantity:2,expectedRevision:0},db)).rejects.toMatchObject({status:503});
    expect(await owner.cart.count({where:{userId:actor.userId}})).toBe(0); expect(await owner.cartItem.count({where:{cart:{userId:actor.userId}}})).toBe(0);
    expect((await db.product.findUniqueOrThrow({where:{id:pouch}})).stock).toBe(20);
  } finally {await owner.$executeRawUnsafe('DROP TRIGGER t04_fail_revision ON commerce."Cart"'); await owner.$executeRawUnsafe('DROP FUNCTION commerce.t04_fail_revision()');}
});
it('rolls back a changed existing quantity when PostgreSQL rejects the revision update',async()=>{
  await addCartItem(actor,{productId:pouch,quantity:2,expectedRevision:0},db);
  await owner.$executeRawUnsafe(`CREATE FUNCTION commerce.t04_fail_existing() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic revision failure'; END $$`);
  await owner.$executeRawUnsafe('CREATE TRIGGER t04_fail_existing BEFORE UPDATE ON commerce."Cart" FOR EACH ROW EXECUTE FUNCTION commerce.t04_fail_existing()');
  try {
    await expect(setCartQuantity(actor,{productId:pouch,quantity:3,expectedRevision:1},db)).rejects.toMatchObject({status:503});
    expect(await getCart(actor,db)).toMatchObject({revision:1,totalPaise:69800});
  } finally {await owner.$executeRawUnsafe('DROP TRIGGER t04_fail_existing ON commerce."Cart"'); await owner.$executeRawUnsafe('DROP FUNCTION commerce.t04_fail_existing()');}
});
