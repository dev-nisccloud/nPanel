DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'customer_asset_mapping'
      AND att.attname = 'meta_ads_account_id'
      AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.customer_asset_mapping DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_campaign_analysis" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_insight" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_ad_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_ad" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_ad_set_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_ad_set" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_campaign_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_campaign" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_account_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "meta_ads_account" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "google_ads_account_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "google_ads_account" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "google_ads_integration_activity_log" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "google_ads_integration" CASCADE;
