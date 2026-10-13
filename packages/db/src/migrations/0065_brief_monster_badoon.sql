CREATE TABLE "etims_code" (
	"cd_cls" text NOT NULL,
	"cd_cls_nm" text NOT NULL,
	"cd" text NOT NULL,
	"cd_nm" text NOT NULL,
	"use_yn" text DEFAULT 'Y',
	"synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "etims_code_pk" PRIMARY KEY("cd_cls","cd")
);
--> statement-breakpoint
CREATE INDEX "etims_code_cls_idx" ON "etims_code" USING btree ("cd_cls");