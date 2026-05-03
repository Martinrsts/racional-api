ALTER TABLE "holding" ALTER COLUMN "portfolio_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "holding" ALTER COLUMN "stock_isin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "portfolio_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "stock_isin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "order_id" SET NOT NULL;