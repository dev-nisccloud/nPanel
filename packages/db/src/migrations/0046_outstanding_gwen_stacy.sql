ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "merchant_request_id" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "amount" integer;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "currency" text DEFAULT 'KES';--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "account_reference" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "transaction_description" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "mpesa_response_code" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "mpesa_response_description" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "mpesa_customer_message" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "mpesa_receipt_number" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "mpesa_transaction_date" text;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD COLUMN "provider_environment" text;