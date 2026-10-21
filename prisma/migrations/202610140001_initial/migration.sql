-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "commerce";

-- CreateEnum
CREATE TYPE "commerce"."Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "commerce"."OrderStatus" AS ENUM ('PAYMENT_FAILED', 'CONFIRMED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "commerce"."PaymentOutcome" AS ENUM ('DECLINED', 'SUCCEEDED');

-- CreateTable
CREATE TABLE "commerce"."Profile" (
    "id" UUID NOT NULL,
    "role" "commerce"."Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."Category" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."Collection" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."Product" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "imagePath" VARCHAR(240) NOT NULL,
    "imageAlt" VARCHAR(200) NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "compareAtPricePaise" INTEGER,
    "material" VARCHAR(80) NOT NULL,
    "dimensions" VARCHAR(80) NOT NULL,
    "care" VARCHAR(400) NOT NULL,
    "includedContents" VARCHAR(200) NOT NULL,
    "occasionTags" TEXT[],
    "intentTags" TEXT[],
    "stock" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."ProductCollection" (
    "productId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("productId","collectionId")
);

-- CreateTable
CREATE TABLE "commerce"."Cart" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."CartItem" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."Order" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(80) NOT NULL,
    "userId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "sourceCartRevision" INTEGER NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "status" "commerce"."OrderStatus" NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "subtotalPaise" INTEGER NOT NULL,
    "shippingPaise" INTEGER NOT NULL DEFAULT 0,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "addressSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "skuSnapshot" VARCHAR(80) NOT NULL,
    "nameSnapshot" VARCHAR(120) NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."PaymentAttempt" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "outcome" "commerce"."PaymentOutcome" NOT NULL,
    "reasonCode" VARCHAR(80) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."InventoryMovement" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "orderId" UUID,
    "actorId" UUID,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" VARCHAR(240) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "entityId" VARCHAR(120) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "safeChange" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."RequestBucket" (
    "userId" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RequestBucket_pkey" PRIMARY KEY ("userId","action","windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "commerce"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "commerce"."Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "commerce"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "commerce"."Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_active_pricePaise_idx" ON "commerce"."Product"("categoryId", "active", "pricePaise");

-- CreateIndex
CREATE INDEX "ProductCollection_collectionId_position_productId_idx" ON "commerce"."ProductCollection"("collectionId", "position", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "commerce"."Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "commerce"."CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "commerce"."Order"("reference");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "commerce"."Order"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "commerce"."Order"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_orderId_key" ON "commerce"."PaymentAttempt"("orderId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "commerce"."InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityId_createdAt_idx" ON "commerce"."AuditEvent"("entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "commerce"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "commerce"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."ProductCollection" ADD CONSTRAINT "ProductCollection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "commerce"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."ProductCollection" ADD CONSTRAINT "ProductCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "commerce"."Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "commerce"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "commerce"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "commerce"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "commerce"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."Order" ADD CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "commerce"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "commerce"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "commerce"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "commerce"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "commerce"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce"."RequestBucket" ADD CONSTRAINT "RequestBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "commerce"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
