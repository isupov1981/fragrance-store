-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "marketingConsentAt" TIMESTAMP(3);
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "consentSource" TEXT;
