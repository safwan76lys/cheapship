-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('FLIGHT_NEEDED', 'PARCEL_NEEDED');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."AlertTriggerType" AS ENUM ('FLIGHT', 'PARCEL');

-- CreateEnum
CREATE TYPE "public"."AlertNotificationStatus" AS ENUM ('PENDING', 'SENT', 'VIEWED', 'CLICKED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "aiAnalysisResult" TEXT,
ADD COLUMN     "identityVerificationStatus" TEXT DEFAULT 'pending';

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT,
    "departureDate" TIMESTAMP(3),
    "departureDateFlex" INTEGER,
    "maxPrice" DOUBLE PRECISION,
    "maxWeight" DOUBLE PRECISION,
    "description" TEXT,
    "departureLat" DOUBLE PRECISION,
    "departureLng" DOUBLE PRECISION,
    "radius" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alert_notifications" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggerType" "public"."AlertTriggerType" NOT NULL,
    "status" "public"."AlertNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "alert_notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alert_notifications" ADD CONSTRAINT "alert_notifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alert_notifications" ADD CONSTRAINT "alert_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
