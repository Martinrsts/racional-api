ALTER TABLE "transaction" DROP CONSTRAINT "transaction_order_id_order_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "order_id";