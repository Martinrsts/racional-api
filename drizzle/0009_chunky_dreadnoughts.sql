ALTER TABLE "order" DROP CONSTRAINT "order_account_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "account_id";