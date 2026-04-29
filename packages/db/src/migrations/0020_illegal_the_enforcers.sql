CREATE TABLE "ip_records" (
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
