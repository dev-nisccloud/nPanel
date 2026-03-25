CREATE TABLE "agency_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "agency_permission_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "agency_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "agency_role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "agency_role_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"title" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"tool_calls" jsonb,
	"tool_call_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_customer_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_created" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp NOT NULL,
	"last_synced_at" timestamp,
	"platform_data" jsonb,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_integration_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"customer_integration_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "creative_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"current_internal_version" integer,
	"current_public_version" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"last_modified_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_asset_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_asset_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_version_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"parent_comment_id" text,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"mentions" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "creative_asset_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_id" text NOT NULL,
	"user_id" text NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_comment" boolean DEFAULT true NOT NULL,
	"can_approve" boolean DEFAULT false NOT NULL,
	"can_publish" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_asset_version" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_id" text NOT NULL,
	"internal_version_number" integer NOT NULL,
	"public_version_number" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"internal_approval_status" text DEFAULT 'PENDING' NOT NULL,
	"public_approval_status" text DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_metadata" jsonb,
	"version_notes" text,
	"changes_summary" text,
	"previous_version_id" text,
	"internal_approved_by" text,
	"internal_approved_at" timestamp,
	"internal_rejected_by" text,
	"internal_rejected_at" timestamp,
	"internal_rejection_reason" text,
	"public_approved_by" text,
	"public_approved_at" timestamp,
	"public_rejected_by" text,
	"public_rejected_at" timestamp,
	"public_rejection_reason" text,
	"made_public_by" text,
	"made_public_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_asset_version_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_version_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_brief" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"background" text NOT NULL,
	"objectives" text NOT NULL,
	"requirements" text NOT NULL,
	"comments" text,
	"style" text,
	"copy" text,
	"mandatory_elements" text,
	"design_preference" text,
	"approver_user_id" text,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"timeline_start_date" timestamp,
	"timeline_end_date" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_brief_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_brief_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"comment" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_brief_reference_image" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_brief_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_transfer_request" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_name" text NOT NULL,
	"auth_code" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provider_price_amount" text,
	"provider_price_currency" text,
	"customer_price_amount" text,
	"customer_price_currency" text,
	"team_id" text,
	"submitted_to_provider_at" timestamp,
	"provider_response" jsonb,
	"nisc_order_id" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_name" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"open_provider_id" integer NOT NULL,
	"activation_date" timestamp,
	"expiration_date" timestamp,
	"renewal_date" timestamp,
	"registration_date" timestamp NOT NULL,
	"open_provider_price" text,
	"nisc_price" text,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"customer_integration_id" text,
	"nameserver_group_id" text,
	CONSTRAINT "domain_domain_name_unique" UNIQUE("domain_name")
);
--> statement-breakpoint
CREATE TABLE "domain_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"team_id" text,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_renewal" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"renewed_by" text NOT NULL,
	"renewal_date" timestamp NOT NULL,
	"team_id" text,
	"open_provider_price" text,
	"nisc_price" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "domain_renewal_domain_id_unique" UNIQUE("domain_id")
);
--> statement-breakpoint
CREATE TABLE "domain_renewal_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"domain_renewal_id" text NOT NULL,
	"team_id" text,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"transferred_by" text,
	"auth_code" text NOT NULL,
	"status" text DEFAULT 'PENDING_TRANSFER' NOT NULL,
	"team_id" text,
	"transfer_requested_at" timestamp NOT NULL,
	"transfer_completed_at" timestamp,
	"open_provider_price" text,
	"nisc_price" text,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"nameserver_group_id" text
);
--> statement-breakpoint
CREATE TABLE "domain_transfer_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"domain_transfer_id" text NOT NULL,
	"team_id" text,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_builder_design" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"team_id" text,
	"json" text NOT NULL,
	"thumbnail_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_builder_design_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"email_builder_design_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_builder_library" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_url" text NOT NULL,
	"storage_key" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipient" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"to_email" text NOT NULL,
	"resend_id" text,
	"resend_message_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_audience" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text,
	"team_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_audience_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"audience_id" text NOT NULL,
	"name" text,
	"phone_number" text,
	"email_address" text,
	"description" text,
	"company" text,
	"status" text DEFAULT 'SUBSCRIBED',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"from_email" text NOT NULL,
	"from_name" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"html_content" text,
	"text_content" text,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"email_domain_id" text,
	"user_id" text NOT NULL,
	"team_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaign_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaign_send_job" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_domain" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_name" text NOT NULL,
	"resend_domain_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"verification_status" text,
	"verification_data" jsonb,
	"dns_records" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "email_domain_domain_name_unique" UNIQUE("domain_name")
);
--> statement-breakpoint
CREATE TABLE "email_domain_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_domain_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_event" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_recipient_id" text NOT NULL,
	"type" text NOT NULL,
	"event_created_at" timestamp NOT NULL,
	"resend_email_id" text,
	"data" jsonb NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_event_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"email_event_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"user_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_configuration" (
	"id" text PRIMARY KEY NOT NULL,
	"kra_pin" text NOT NULL,
	"branch_id" text DEFAULT '00' NOT NULL,
	"branch_name" text,
	"device_serial_number" text NOT NULL,
	"cmc_key" text,
	"is_sandbox" boolean DEFAULT true NOT NULL,
	"is_initialized" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_item" (
	"id" text PRIMARY KEY NOT NULL,
	"local_item_id" text,
	"item_cd" text NOT NULL,
	"item_cls_cd" text NOT NULL,
	"item_nm" text NOT NULL,
	"tax_ty_cd" text DEFAULT 'A' NOT NULL,
	"pkg_unit_cd" text DEFAULT 'OU' NOT NULL,
	"origin_country_cd" text,
	"packaging_unit" text,
	"quantity_unit" text,
	"unit_price" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_account" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"account_name" text,
	"currency_code" text,
	"time_zone" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"team_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_account_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp,
	"scope" text,
	"token_type" text,
	"last_token_refresh_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_integration_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hosting_type" text NOT NULL,
	"plesk_service_plan_id" text,
	"plesk_filter_id" text,
	"plesk_ip_address" text,
	"features" jsonb NOT NULL,
	"highlights" jsonb NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"nisc_price" text,
	"nisc_currency" text DEFAULT 'KES',
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"setup_fee" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_plan_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hosting_plan_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_renewal" (
	"id" text PRIMARY KEY NOT NULL,
	"hosting_subscription_id" text NOT NULL,
	"renewed_by" text,
	"renewal_date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"billing_cycle" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"nisc_price" text,
	"nisc_currency" text DEFAULT 'KES',
	"invoice_number" text,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_renewal_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hosting_renewal_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"hosting_plan_id" text NOT NULL,
	"team_id" text,
	"provisioned_by" text,
	"plesk_filter_id" text NOT NULL,
	"plesk_owner_id" text,
	"plesk_service_id" text,
	"plesk_name" text,
	"plesk_status" integer,
	"plesk_description" text,
	"plesk_admin_description" text,
	"plesk_ftp_login" text,
	"plesk_ftp_password" text,
	"primary_domain" text,
	"domain_id" text,
	"operation" text DEFAULT 'PROVISION' NOT NULL,
	"provisioning_method" text DEFAULT 'AUTOMATIC' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"hosting_type" text NOT NULL,
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"next_renewal_date" timestamp,
	"expiry_date" timestamp,
	"nisc_price" text,
	"nisc_currency" text DEFAULT 'KES',
	"invoice_number" text,
	"customer_integration_id" text,
	"notes" text,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "hosting_subscription_plesk_filter_id_unique" UNIQUE("plesk_filter_id")
);
--> statement-breakpoint
CREATE TABLE "hosting_subscription_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hosting_subscription_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_service_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"plan_type" text NOT NULL,
	"hosting_sub_type" text,
	"plesk_service_plan_id" text,
	"plesk_filter_id" text,
	"plesk_ip_address" text,
	"features" jsonb NOT NULL,
	"highlights" jsonb NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"nisc_price" text,
	"nisc_currency" text DEFAULT 'KES',
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"setup_fee" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_service_plan_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nisc_service_plan_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wordpress_instance" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"hosting_subscription_id" text,
	"installation_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "wordpress_instance_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "wordpress_instance_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wordpress_instance_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_remover_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"original_image_url" text NOT NULL,
	"original_image_key" text NOT NULL,
	"original_image_file_name" text NOT NULL,
	"original_image_size" integer NOT NULL,
	"original_image_mime_type" text NOT NULL,
	"original_image_metadata" jsonb,
	"processed_image_url" text,
	"processed_image_key" text,
	"processed_image_file_name" text,
	"processed_image_size" integer,
	"processed_image_mime_type" text,
	"processed_image_metadata" jsonb,
	"model_id" text NOT NULL,
	"model_name" text,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"error_message" text,
	"qstash_message_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_remover_generation_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"background_remover_generation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_generator_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"prompt" text NOT NULL,
	"reference_image_urls" jsonb,
	"aspect_ratio" text NOT NULL,
	"output_format" text NOT NULL,
	"resolution" text NOT NULL,
	"variations_count" integer NOT NULL,
	"model_id" text NOT NULL,
	"model_name" text,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"error_message" text,
	"qstash_message_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_generator_generation_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"image_generator_generation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_generator_variation" (
	"id" text PRIMARY KEY NOT NULL,
	"image_generator_generation_id" text NOT NULL,
	"variation_index" integer NOT NULL,
	"status" text DEFAULT 'PROCESSING' NOT NULL,
	"error_message" text,
	"prediction_id" text,
	"image_url" text,
	"image_key" text,
	"image_file_name" text,
	"image_size" integer,
	"image_mime_type" text,
	"image_metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_ai_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"prompt" text NOT NULL,
	"reference_image_urls" jsonb,
	"image_url" text NOT NULL,
	"image_key" text NOT NULL,
	"image_file_name" text NOT NULL,
	"image_size" integer NOT NULL,
	"image_mime_type" text NOT NULL,
	"image_metadata" jsonb,
	"model_id" text NOT NULL,
	"model_name" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_ai_generation_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"image_gen_ai_generation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"json" text NOT NULL,
	"height" integer NOT NULL,
	"width" integer NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_project_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"image_gen_project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"json" text NOT NULL,
	"height" integer NOT NULL,
	"width" integer NOT NULL,
	"thumbnail_url" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_template_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"image_gen_template_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagegen_upload_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"image_gen_upload_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"base_currency" text DEFAULT 'KES' NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text NOT NULL,
	CONSTRAINT "team_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_billing_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"billing_email" text NOT NULL,
	"billing_phone" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"postal_code" text,
	"tax_id" text,
	"additional_notes" text,
	"updated_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_billing_settings_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team_billing_settings_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"team_billing_settings_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"team_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"invited_by_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invite_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_credit_note" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"team_id" text,
	"credit_number" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"reason" text,
	"note" text,
	"metadata" jsonb,
	"issued_at" timestamp,
	"applied_at" timestamp,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "invoice_credit_note_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_credit_note_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"credit_note_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"customer_id" text,
	"customer_name" text,
	"customer_email" text,
	"invoice_number" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"amount" text,
	"subtotal" text,
	"tax" text,
	"tax_percentage" double precision,
	"vat" text,
	"discount" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"credited_amount" text,
	"credit_balance" text,
	"issue_date" timestamp,
	"due_date" timestamp,
	"paid_at" timestamp,
	"sent_at" timestamp,
	"reminder_sent_at" timestamp,
	"viewed_at" timestamp,
	"note" text,
	"internal_note" text,
	"from_details" jsonb,
	"customer_details" jsonb,
	"payment_details" jsonb,
	"note_details" jsonb,
	"template" jsonb,
	"top_block" jsonb,
	"bottom_block" jsonb,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"kra_invoice_number" text,
	"kra_receipt_number" text,
	"kra_signature" text,
	"kra_qr_code" text,
	"kra_verified_date" timestamp,
	"kra_status" text,
	"kra_error" text,
	CONSTRAINT "invoice_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invoice_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counter" (
	"id" text PRIMARY KEY DEFAULT 'invoice-counter' NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text,
	"description" text,
	"quantity" double precision,
	"unit" text,
	"price" text,
	"discount" text,
	"total" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"reference" text,
	"provider_reference" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"method" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"recorded_by" text,
	"balance_before" text,
	"balance_after" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_transaction_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_transaction_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"_id" text PRIMARY KEY NOT NULL,
	"ticket_number" text NOT NULL,
	"subject" text,
	"description" text,
	"type" text DEFAULT 'GENERAL' NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"source" text DEFAULT 'WEB' NOT NULL,
	"created_by_id" text NOT NULL,
	"team_id" text,
	"assigned_to_id" text,
	"last_message_id" text,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"customer_unread_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"first_response_at" timestamp,
	"last_response_at" timestamp,
	"last_customer_response_at" timestamp,
	"last_agent_response_at" timestamp,
	CONSTRAINT "ticket_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "ticket_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"description" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_attachment" (
	"_id" text PRIMARY KEY NOT NULL,
	"ticket_id" text,
	"message_id" text,
	"uploaded_by_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_url" text NOT NULL,
	"storage_key" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_message" (
	"_id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"read_status" text DEFAULT 'SENT' NOT NULL,
	"read_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ticket_tag" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "ticket_tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ticket_tag_relation" (
	"_id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"added_by_id" text,
	"added_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_design_quote_request" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company_name" text NOT NULL,
	"domain" text,
	"project_type" text NOT NULL,
	"project_description" text NOT NULL,
	"budget" text NOT NULL,
	"target_launch_date" timestamp,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"submitted_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"user_id" text,
	"team_id" text,
	"product_id" text NOT NULL,
	"product_plan_id" text,
	"order_id" text,
	"nisc_order_id" text,
	"subscribed_by" text,
	"recorded_by" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"subscription_date" timestamp,
	"billing_cycle" text,
	"next_renewal_date" timestamp,
	"expiry_date" timestamp,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"upgraded_to_subscription_id" text,
	"upgraded_at" timestamp,
	"downgraded_to_subscription_id" text,
	"downgraded_at" timestamp,
	"pricing_model" text NOT NULL,
	"agreed_price" text,
	"agreed_currency" text DEFAULT 'KES',
	"agreed_cost" text,
	"agreed_cost_currency" text DEFAULT 'KES',
	"provider_cost" text,
	"provider_cost_currency" text DEFAULT 'KES',
	"agreed_commission_rate" numeric(10, 4),
	"agreed_commission_base" text,
	"primary_domain" text,
	"plesk_filter_id" text,
	"plesk_owner_id" text,
	"plesk_ftp_login" text,
	"plesk_ftp_password" text,
	"hosting_type" text,
	"open_provider_id" integer,
	"domain_auth_code" text,
	"nameserver_group_id" text,
	"wp_installation_id" integer,
	"service_refs" jsonb,
	"hosting_subscription_id" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nisc_client_subscription_upgraded_to_subscription_id_unique" UNIQUE("upgraded_to_subscription_id"),
	CONSTRAINT "nisc_client_subscription_downgraded_to_subscription_id_unique" UNIQUE("downgraded_to_subscription_id"),
	CONSTRAINT "nisc_client_subscription_hosting_subscription_id_unique" UNIQUE("hosting_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription_renewal" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"renewal_type" text NOT NULL,
	"renewed_by" text,
	"renewal_date" timestamp NOT NULL,
	"new_expiry_date" timestamp,
	"new_next_renewal_date" timestamp,
	"billing_cycle" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"renewal_price" text,
	"renewal_currency" text DEFAULT 'KES',
	"provider_renewal_price" text,
	"provider_renewal_currency" text DEFAULT 'KES',
	"order_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription_renewal_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"renewal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"usage_kind" text NOT NULL,
	"credits" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_client_subscription_usage_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_usage_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"service_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_add_on" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_product_add_on" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"base_product_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_product_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pricing_model" text NOT NULL,
	"billing_cycle" text,
	"price" text,
	"currency" text DEFAULT 'KES',
	"setup_fee" text,
	"cost" text,
	"cost_currency" text DEFAULT 'KES',
	"commission_rate" numeric(10, 4),
	"commission_base" text,
	"commission_base_description" text,
	"plan_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"plesk_service_plan_id" text,
	"plesk_filter_id" text,
	"plesk_ip_address" text,
	"hosting_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_product_plan_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"product_plan_id" text NOT NULL,
	"user_id" text,
	"team_id" text,
	"usage_kind" text NOT NULL,
	"limit_value" text NOT NULL,
	"overuse" text NOT NULL,
	"period" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_product_promo" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" text,
	"discount_currency" text DEFAULT 'KES',
	"product_id" text,
	"product_plan_id" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_order_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nisc_product_promo_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "nisc_product_promo_redeem" (
	"id" text PRIMARY KEY NOT NULL,
	"promo_id" text NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"team_id" text,
	"order_id" text,
	"subscription_id" text,
	"renewal_id" text,
	"discount_applied" text,
	"order_value" text,
	"currency" text DEFAULT 'KES',
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nameserver" (
	"id" text PRIMARY KEY NOT NULL,
	"nameserver_group_id" text NOT NULL,
	"name" text NOT NULL,
	"ipv4" text,
	"ipv6" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nameserver_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nameserver_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nameserver_group" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nameserver_group_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nameserver_group_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tld_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"nameserver_group_id" text,
	"margin_type" text,
	"percentage_margin" text,
	"fixed_margin" text,
	"round_off" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tld_settings_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tld_setting_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"scope" text NOT NULL,
	"target" text NOT NULL,
	"discount_value" text NOT NULL,
	"currency" text DEFAULT 'KES',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"min_order_value" text,
	"hosting_plan_id" text,
	"user_id" text,
	"team_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "promo_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promo_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"promo_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_order" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" text,
	"team_id" text,
	"created_by" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"subtotal" text NOT NULL,
	"total" text NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"nisc_product_promo_id" text,
	"invoice_id" text,
	"invoice_number" text,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"failure_reason" text,
	"qstash_message_id" text,
	"payment_transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nisc_order_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "nisc_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"nisc_order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_plan_id" text,
	"billing_cycle" text,
	"item_price" text NOT NULL,
	"item_subtotal" text NOT NULL,
	"item_currency" text DEFAULT 'KES' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provisioning_error" text,
	"provisioning_error_details" jsonb,
	"nisc_client_subscription_id" text,
	"primary_domain" text,
	"domain_subscription_id" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_order_processing_log" (
	"id" text PRIMARY KEY NOT NULL,
	"nisc_order_id" text NOT NULL,
	"step" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"type" text DEFAULT 'GENERAL' NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"title" text,
	"message" text NOT NULL,
	"link" text,
	"metadata" jsonb,
	"seen" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"notification_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"_id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" text,
	"team_id" text,
	"created_by" text,
	"type" text DEFAULT 'CUSTOM_SERVICE' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"domain_id" text,
	"domain_renewal_id" text,
	"domain_transfer_id" text,
	"hosting_subscription_id" text,
	"hosting_renewal_id" text,
	"subtotal" text,
	"discount" text,
	"is_taxable" boolean,
	"tax_percentage" double precision,
	"tax_amount" text,
	"total" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"promo_code" text,
	"promo_id" text,
	"nisc_product_promo_id" text,
	"invoice_number" text,
	"invoice_id" text,
	"processed_by" text,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "order_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"_id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"nisc_service_plan_id" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"item_price" text NOT NULL,
	"item_subtotal" text NOT NULL,
	"item_currency" text DEFAULT 'KES' NOT NULL,
	"domain_name" text,
	"description" text,
	"admin_description" text,
	"notes" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"is_provisioned" boolean DEFAULT false NOT NULL,
	"provisioning_error" text,
	"hosting_subscription_id" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transaction" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"gateway" text NOT NULL,
	"gateway_status" text,
	"gateway_message" text,
	"gateway_transaction_id" text,
	"merchant_request_id" text,
	"checkout_request_id" text,
	"receipt_number" text,
	"amount" text NOT NULL,
	"paid_amount" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"account_reference" text,
	"transaction_desc" text,
	"phone_number" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"raw_response" jsonb,
	"raw_error" jsonb,
	"initiated_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"failed_at" timestamp,
	"refunded_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transaction_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation" (
	"_id" text PRIMARY KEY NOT NULL,
	"quotation_number" text,
	"customer_name" text,
	"customer_email" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"amount" text,
	"subtotal" text,
	"tax" text,
	"tax_percentage" double precision,
	"vat" text,
	"discount" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"issue_date" timestamp,
	"note" text,
	"internal_note" text,
	"from_details" jsonb,
	"customer_details" jsonb,
	"note_details" jsonb,
	"template" jsonb,
	"top_block" jsonb,
	"bottom_block" jsonb,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "quotation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "quotation_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"quotation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_counter" (
	"id" text PRIMARY KEY DEFAULT 'quotation-counter' NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_line_item" (
	"_id" text PRIMARY KEY NOT NULL,
	"quotation_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text,
	"description" text,
	"quantity" double precision,
	"unit" text,
	"price" text,
	"discount" text,
	"total" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_production_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"assets_created" integer DEFAULT 0 NOT NULL,
	"assets_approved" integer DEFAULT 0 NOT NULL,
	"versions_created" integer DEFAULT 0 NOT NULL,
	"avg_velocity_days" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_by_service_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"service_type" text NOT NULL,
	"amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_by_team_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text NOT NULL,
	"amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_report_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"total_revenue" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_invoiced" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(20, 2) DEFAULT '0' NOT NULL,
	"taxable_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"paid_invoice_count" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_report" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"report_name" text DEFAULT '' NOT NULL,
	"report_month" text NOT NULL,
	"report_year" text NOT NULL,
	"website_url" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"recommendations" text,
	"sessions" text,
	"total_web_traffic" text,
	"total_views" text,
	"bounce_rate" text,
	"users" text,
	"returning_users" text,
	"event_count" text,
	"conversions" text,
	"session_duration" text,
	"engaged_sessions" text,
	"sessions_desktop" text,
	"sessions_mobile" text,
	"sessions_tablet" text,
	"form_submissions" text,
	"impressions" text,
	"clicks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_report_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"seo_report_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_subscription" (
	"_id" text PRIMARY KEY NOT NULL,
	"nisc_service_plan_id" text NOT NULL,
	"team_id" text,
	"order_id" text,
	"subscribed_by" text,
	"subscription_date" timestamp,
	"billing_cycle" text NOT NULL,
	"next_renewal_date" timestamp,
	"status" text NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"hosting_subscription_id" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "service_subscription_hosting_subscription_id_unique" UNIQUE("hosting_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "service_subscription_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"service_subscription_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_subscription_renewal" (
	"_id" text PRIMARY KEY NOT NULL,
	"service_subscription_id" text NOT NULL,
	"order_id" text,
	"renewed_by" text,
	"renewal_date" timestamp NOT NULL,
	"billing_cycle" text NOT NULL,
	"next_renewal_date" timestamp,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_subscription_renewal_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"service_subscription_renewal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linkedin_content_calendar" (
	"_id" text PRIMARY KEY NOT NULL,
	"page_token_id" text,
	"message" text,
	"scheduled_publish_time" timestamp NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"published_post_id" text,
	"published_permalink" text,
	"last_error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"qstash_job_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linkedin_content_calendar_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"calendar_post_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linkedin_content_calendar_media" (
	"_id" text PRIMARY KEY NOT NULL,
	"calendar_post_id" text NOT NULL,
	"media_type" text NOT NULL,
	"url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"caption" text,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_content_calendar" (
	"_id" text PRIMARY KEY NOT NULL,
	"page_token_id" text,
	"message" text,
	"scheduled_publish_time" timestamp NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"published_post_id" text,
	"published_permalink" text,
	"last_error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"qstash_job_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_content_calendar_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"calendar_post_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_content_calendar_media" (
	"_id" text PRIMARY KEY NOT NULL,
	"calendar_post_id" text NOT NULL,
	"media_type" text NOT NULL,
	"url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"caption" text,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_integration" (
	"_id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"token_type" text,
	"last_token_refresh_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_integration_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_page_token" (
	"_id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"team_id" text,
	"platform" text NOT NULL,
	"page_id" text NOT NULL,
	"page_name" text,
	"page_username" text,
	"page_picture" text,
	"page_category" text,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_token_refresh_at" timestamp,
	"user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_page_token_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"page_token_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_account" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_name" text,
	"currency" text,
	"timezone" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"spend_limit" text,
	"amount_spent" text,
	"balance" text,
	"team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_ads_account_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "meta_ads_account_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_ad" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_set_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"account_id" text NOT NULL,
	"ad_id" text NOT NULL,
	"ad_name" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"creative" jsonb,
	"created_time" timestamp,
	"updated_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_ad_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ad_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_ad_set" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"account_id" text NOT NULL,
	"ad_set_id" text NOT NULL,
	"ad_set_name" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"daily_budget" text,
	"lifetime_budget" text,
	"budget_remaining" text,
	"bid_amount" text,
	"targeting" jsonb,
	"start_time" timestamp,
	"stop_time" timestamp,
	"created_time" timestamp,
	"updated_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_ad_set_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ad_set_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"campaign_name" text,
	"objective" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"daily_budget" text,
	"lifetime_budget" text,
	"budget_remaining" text,
	"start_time" timestamp,
	"stop_time" timestamp,
	"created_time" timestamp,
	"updated_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_campaign_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_ads_insight" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"campaign_id" text,
	"ad_set_id" text,
	"ad_id" text,
	"date_start" timestamp NOT NULL,
	"date_end" timestamp NOT NULL,
	"breakdown" jsonb,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'CUSTOMER' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "agency_role_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_accessed_team_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_sound_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "browser_notifications_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_sound_volume" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "browser_notification_permission" text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_preferences_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "agency_role_permission" ADD CONSTRAINT "agency_role_permission_role_id_agency_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."agency_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_role_permission" ADD CONSTRAINT "agency_role_permission_permission_id_agency_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."agency_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_message" ADD CONSTRAINT "ai_chat_message_chat_id_ai_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ai_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_integration" ADD CONSTRAINT "customer_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_integration_activity_log" ADD CONSTRAINT "customer_integration_activity_log_customer_integration_id_customer_integration_id_fk" FOREIGN KEY ("customer_integration_id") REFERENCES "public"."customer_integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset" ADD CONSTRAINT "creative_asset_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_activity_log" ADD CONSTRAINT "creative_asset_activity_log_creative_asset_id_creative_asset_id_fk" FOREIGN KEY ("creative_asset_id") REFERENCES "public"."creative_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_comment" ADD CONSTRAINT "creative_asset_comment_creative_asset_version_id_creative_asset_version_id_fk" FOREIGN KEY ("creative_asset_version_id") REFERENCES "public"."creative_asset_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_comment" ADD CONSTRAINT "creative_asset_comment_parent_comment_id_creative_asset_comment_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."creative_asset_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_permission" ADD CONSTRAINT "creative_asset_permission_creative_asset_id_creative_asset_id_fk" FOREIGN KEY ("creative_asset_id") REFERENCES "public"."creative_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_version" ADD CONSTRAINT "creative_asset_version_creative_asset_id_creative_asset_id_fk" FOREIGN KEY ("creative_asset_id") REFERENCES "public"."creative_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_version_activity_log" ADD CONSTRAINT "creative_asset_version_activity_log_creative_asset_version_id_creative_asset_version_id_fk" FOREIGN KEY ("creative_asset_version_id") REFERENCES "public"."creative_asset_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_approver_user_id_user_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_brief_activity_log" ADD CONSTRAINT "creative_brief_activity_log_creative_brief_id_creative_brief_id_fk" FOREIGN KEY ("creative_brief_id") REFERENCES "public"."creative_brief"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_brief_reference_image" ADD CONSTRAINT "creative_brief_reference_image_creative_brief_id_creative_brief_id_fk" FOREIGN KEY ("creative_brief_id") REFERENCES "public"."creative_brief"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_nisc_order_id_nisc_order_id_fk" FOREIGN KEY ("nisc_order_id") REFERENCES "public"."nisc_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_customer_integration_id_customer_integration_id_fk" FOREIGN KEY ("customer_integration_id") REFERENCES "public"."customer_integration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_nameserver_group_id_nameserver_group_id_fk" FOREIGN KEY ("nameserver_group_id") REFERENCES "public"."nameserver_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_activity_log" ADD CONSTRAINT "domain_activity_log_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_renewal_activity_log" ADD CONSTRAINT "domain_renewal_activity_log_domain_renewal_id_domain_renewal_id_fk" FOREIGN KEY ("domain_renewal_id") REFERENCES "public"."domain_renewal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_nameserver_group_id_nameserver_group_id_fk" FOREIGN KEY ("nameserver_group_id") REFERENCES "public"."nameserver_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_transfer_activity_log" ADD CONSTRAINT "domain_transfer_activity_log_domain_transfer_id_domain_transfer_id_fk" FOREIGN KEY ("domain_transfer_id") REFERENCES "public"."domain_transfer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD CONSTRAINT "email_builder_design_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD CONSTRAINT "email_builder_design_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_design_activity_log" ADD CONSTRAINT "email_builder_design_activity_log_email_builder_design_id_email_builder_design_id_fk" FOREIGN KEY ("email_builder_design_id") REFERENCES "public"."email_builder_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_library" ADD CONSTRAINT "email_builder_library_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_library" ADD CONSTRAINT "email_builder_library_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipient" ADD CONSTRAINT "campaign_recipient_campaign_id_email_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_audience" ADD CONSTRAINT "email_audience_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_audience" ADD CONSTRAINT "email_audience_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_audience_contact" ADD CONSTRAINT "email_audience_contact_audience_id_email_audience_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."email_audience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_email_domain_id_email_domain_id_fk" FOREIGN KEY ("email_domain_id") REFERENCES "public"."email_domain"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign_activity_log" ADD CONSTRAINT "email_campaign_activity_log_campaign_id_email_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign_send_job" ADD CONSTRAINT "email_campaign_send_job_campaign_id_email_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_domain_activity_log" ADD CONSTRAINT "email_domain_activity_log_email_domain_id_email_domain_id_fk" FOREIGN KEY ("email_domain_id") REFERENCES "public"."email_domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_event" ADD CONSTRAINT "email_event_campaign_recipient_id_campaign_recipient_id_fk" FOREIGN KEY ("campaign_recipient_id") REFERENCES "public"."campaign_recipient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_event_activity_log" ADD CONSTRAINT "email_event_activity_log_email_event_id_email_event_id_fk" FOREIGN KEY ("email_event_id") REFERENCES "public"."email_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_ads_account" ADD CONSTRAINT "google_ads_account_integration_id_google_ads_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."google_ads_integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_ads_account" ADD CONSTRAINT "google_ads_account_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_ads_account_activity_log" ADD CONSTRAINT "google_ads_account_activity_log_account_id_google_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."google_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_ads_integration" ADD CONSTRAINT "google_ads_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_ads_integration_activity_log" ADD CONSTRAINT "google_ads_integration_activity_log_integration_id_google_ads_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."google_ads_integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_plan_activity_log" ADD CONSTRAINT "hosting_plan_activity_log_hosting_plan_id_hosting_plan_id_fk" FOREIGN KEY ("hosting_plan_id") REFERENCES "public"."hosting_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_renewal" ADD CONSTRAINT "hosting_renewal_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_renewal_activity_log" ADD CONSTRAINT "hosting_renewal_activity_log_hosting_renewal_id_hosting_renewal_id_fk" FOREIGN KEY ("hosting_renewal_id") REFERENCES "public"."hosting_renewal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_hosting_plan_id_hosting_plan_id_fk" FOREIGN KEY ("hosting_plan_id") REFERENCES "public"."hosting_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_customer_integration_id_customer_integration_id_fk" FOREIGN KEY ("customer_integration_id") REFERENCES "public"."customer_integration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_subscription_activity_log" ADD CONSTRAINT "hosting_subscription_activity_log_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_service_plan_activity_log" ADD CONSTRAINT "nisc_service_plan_activity_log_nisc_service_plan_id_nisc_service_plan_id_fk" FOREIGN KEY ("nisc_service_plan_id") REFERENCES "public"."nisc_service_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpress_instance" ADD CONSTRAINT "wordpress_instance_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpress_instance" ADD CONSTRAINT "wordpress_instance_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpress_instance_activity_log" ADD CONSTRAINT "wordpress_instance_activity_log_wordpress_instance_id_wordpress_instance_id_fk" FOREIGN KEY ("wordpress_instance_id") REFERENCES "public"."wordpress_instance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_remover_generation" ADD CONSTRAINT "background_remover_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_remover_generation" ADD CONSTRAINT "background_remover_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_remover_generation_activity_log" ADD CONSTRAINT "background_remover_generation_activity_log_background_remover_generation_id_background_remover_generation_id_fk" FOREIGN KEY ("background_remover_generation_id") REFERENCES "public"."background_remover_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generator_generation" ADD CONSTRAINT "image_generator_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generator_generation" ADD CONSTRAINT "image_generator_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generator_generation_activity_log" ADD CONSTRAINT "image_generator_generation_activity_log_image_generator_generation_id_image_generator_generation_id_fk" FOREIGN KEY ("image_generator_generation_id") REFERENCES "public"."image_generator_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generator_variation" ADD CONSTRAINT "image_generator_variation_image_generator_generation_id_image_generator_generation_id_fk" FOREIGN KEY ("image_generator_generation_id") REFERENCES "public"."image_generator_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_ai_generation" ADD CONSTRAINT "imagegen_ai_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_ai_generation" ADD CONSTRAINT "imagegen_ai_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_ai_generation_activity_log" ADD CONSTRAINT "imagegen_ai_generation_activity_log_image_gen_ai_generation_id_imagegen_ai_generation_id_fk" FOREIGN KEY ("image_gen_ai_generation_id") REFERENCES "public"."imagegen_ai_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_project" ADD CONSTRAINT "imagegen_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_project" ADD CONSTRAINT "imagegen_project_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_project_activity_log" ADD CONSTRAINT "imagegen_project_activity_log_image_gen_project_id_imagegen_project_id_fk" FOREIGN KEY ("image_gen_project_id") REFERENCES "public"."imagegen_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_template" ADD CONSTRAINT "imagegen_template_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_template_activity_log" ADD CONSTRAINT "imagegen_template_activity_log_image_gen_template_id_imagegen_template_id_fk" FOREIGN KEY ("image_gen_template_id") REFERENCES "public"."imagegen_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_upload" ADD CONSTRAINT "imagegen_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_upload" ADD CONSTRAINT "imagegen_upload_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagegen_upload_activity_log" ADD CONSTRAINT "imagegen_upload_activity_log_image_gen_upload_id_imagegen_upload_id_fk" FOREIGN KEY ("image_gen_upload_id") REFERENCES "public"."imagegen_upload"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_billing_settings" ADD CONSTRAINT "team_billing_settings_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_billing_settings_activity_log" ADD CONSTRAINT "team_billing_settings_activity_log_team_billing_settings_id_team_billing_settings_id_fk" FOREIGN KEY ("team_billing_settings_id") REFERENCES "public"."team_billing_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD CONSTRAINT "invoice_credit_note_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD CONSTRAINT "invoice_credit_note_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_credit_note_activity_log" ADD CONSTRAINT "invoice_credit_note_activity_log_credit_note_id_invoice_credit_note_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."invoice_credit_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_activity_log" ADD CONSTRAINT "invoice_activity_log_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_transaction" ADD CONSTRAINT "invoice_transaction_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_transaction_activity_log" ADD CONSTRAINT "invoice_transaction_activity_log_invoice_transaction_id_invoice_transaction_id_fk" FOREIGN KEY ("invoice_transaction_id") REFERENCES "public"."invoice_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_activity_log" ADD CONSTRAINT "ticket_activity_log_ticket_id_ticket__id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_ticket_id_ticket__id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_message_id_ticket_message__id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ticket_message"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_ticket_id_ticket__id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tag_relation" ADD CONSTRAINT "ticket_tag_relation_ticket_id_ticket__id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tag_relation" ADD CONSTRAINT "ticket_tag_relation_tag_id_ticket_tag__id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."ticket_tag"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_design_quote_request" ADD CONSTRAINT "web_design_quote_request_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_upgraded_to_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("upgraded_to_subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_downgraded_to_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("downgraded_to_subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_activity_log" ADD CONSTRAINT "nisc_client_subscription_activity_log_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_renewal" ADD CONSTRAINT "nisc_client_subscription_renewal_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_renewal_activity_log" ADD CONSTRAINT "nisc_client_subscription_renewal_activity_log_renewal_id_nisc_client_subscription_renewal_id_fk" FOREIGN KEY ("renewal_id") REFERENCES "public"."nisc_client_subscription_renewal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_usage" ADD CONSTRAINT "nisc_client_subscription_usage_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_usage_activity_log" ADD CONSTRAINT "nisc_client_subscription_usage_activity_log_subscription_usage_id_nisc_client_subscription_usage_id_fk" FOREIGN KEY ("subscription_usage_id") REFERENCES "public"."nisc_client_subscription_usage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_add_on" ADD CONSTRAINT "nisc_product_add_on_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_add_on" ADD CONSTRAINT "nisc_product_add_on_base_product_id_nisc_product_id_fk" FOREIGN KEY ("base_product_id") REFERENCES "public"."nisc_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_plan" ADD CONSTRAINT "nisc_product_plan_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_promo" ADD CONSTRAINT "nisc_product_promo_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_promo" ADD CONSTRAINT "nisc_product_promo_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_promo_id_nisc_product_promo_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."nisc_product_promo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_renewal_id_nisc_client_subscription_renewal_id_fk" FOREIGN KEY ("renewal_id") REFERENCES "public"."nisc_client_subscription_renewal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nameserver" ADD CONSTRAINT "nameserver_nameserver_group_id_nameserver_group_id_fk" FOREIGN KEY ("nameserver_group_id") REFERENCES "public"."nameserver_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nameserver_activity_log" ADD CONSTRAINT "nameserver_activity_log_nameserver_id_nameserver_id_fk" FOREIGN KEY ("nameserver_id") REFERENCES "public"."nameserver"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nameserver_group_activity_log" ADD CONSTRAINT "nameserver_group_activity_log_nameserver_group_id_nameserver_group_id_fk" FOREIGN KEY ("nameserver_group_id") REFERENCES "public"."nameserver_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tld_settings" ADD CONSTRAINT "tld_settings_nameserver_group_id_nameserver_group_id_fk" FOREIGN KEY ("nameserver_group_id") REFERENCES "public"."nameserver_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tld_settings_activity_log" ADD CONSTRAINT "tld_settings_activity_log_tld_setting_id_tld_settings_id_fk" FOREIGN KEY ("tld_setting_id") REFERENCES "public"."tld_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo" ADD CONSTRAINT "promo_hosting_plan_id_hosting_plan_id_fk" FOREIGN KEY ("hosting_plan_id") REFERENCES "public"."hosting_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo" ADD CONSTRAINT "promo_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_activity_log" ADD CONSTRAINT "promo_activity_log_promo_id_promo_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_nisc_product_promo_id_nisc_product_promo_id_fk" FOREIGN KEY ("nisc_product_promo_id") REFERENCES "public"."nisc_product_promo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_nisc_order_id_nisc_order_id_fk" FOREIGN KEY ("nisc_order_id") REFERENCES "public"."nisc_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_product_id_nisc_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."nisc_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_nisc_client_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("nisc_client_subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_domain_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("domain_subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_order_processing_log" ADD CONSTRAINT "nisc_order_processing_log_nisc_order_id_nisc_order_id_fk" FOREIGN KEY ("nisc_order_id") REFERENCES "public"."nisc_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_activity_log" ADD CONSTRAINT "notification_activity_log_notification_id_notification__id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_domain_renewal_id_domain_renewal_id_fk" FOREIGN KEY ("domain_renewal_id") REFERENCES "public"."domain_renewal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_domain_transfer_id_domain_transfer_id_fk" FOREIGN KEY ("domain_transfer_id") REFERENCES "public"."domain_transfer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_hosting_renewal_id_hosting_renewal_id_fk" FOREIGN KEY ("hosting_renewal_id") REFERENCES "public"."hosting_renewal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_promo_id_promo_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_nisc_product_promo_id_nisc_product_promo_id_fk" FOREIGN KEY ("nisc_product_promo_id") REFERENCES "public"."nisc_product_promo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_activity_log" ADD CONSTRAINT "order_activity_log_order_id_order__id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order__id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_nisc_service_plan_id_nisc_service_plan_id_fk" FOREIGN KEY ("nisc_service_plan_id") REFERENCES "public"."nisc_service_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_activity_log" ADD CONSTRAINT "order_item_activity_log_order_item_id_order_item__id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transaction_activity_log" ADD CONSTRAINT "payment_transaction_activity_log_transaction_id_payment_transaction__id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transaction"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_activity_log" ADD CONSTRAINT "quotation_activity_log_quotation_id_quotation__id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_line_item" ADD CONSTRAINT "quotation_line_item_quotation_id_quotation__id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_report" ADD CONSTRAINT "seo_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_report" ADD CONSTRAINT "seo_report_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_report_activity_log" ADD CONSTRAINT "seo_report_activity_log_seo_report_id_seo_report__id_fk" FOREIGN KEY ("seo_report_id") REFERENCES "public"."seo_report"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_nisc_service_plan_id_nisc_service_plan_id_fk" FOREIGN KEY ("nisc_service_plan_id") REFERENCES "public"."nisc_service_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_order_id_order__id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_hosting_subscription_id_hosting_subscription_id_fk" FOREIGN KEY ("hosting_subscription_id") REFERENCES "public"."hosting_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription_activity_log" ADD CONSTRAINT "service_subscription_activity_log_service_subscription_id_service_subscription__id_fk" FOREIGN KEY ("service_subscription_id") REFERENCES "public"."service_subscription"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription_renewal" ADD CONSTRAINT "service_subscription_renewal_service_subscription_id_service_subscription__id_fk" FOREIGN KEY ("service_subscription_id") REFERENCES "public"."service_subscription"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription_renewal" ADD CONSTRAINT "service_subscription_renewal_order_id_order__id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscription_renewal_activity_log" ADD CONSTRAINT "service_subscription_renewal_activity_log_service_subscription_renewal_id_service_subscription_renewal__id_fk" FOREIGN KEY ("service_subscription_renewal_id") REFERENCES "public"."service_subscription_renewal"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_content_calendar" ADD CONSTRAINT "linkedin_content_calendar_page_token_id_social_media_page_token__id_fk" FOREIGN KEY ("page_token_id") REFERENCES "public"."social_media_page_token"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_content_calendar" ADD CONSTRAINT "linkedin_content_calendar_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_content_calendar_activity_log" ADD CONSTRAINT "linkedin_content_calendar_activity_log_calendar_post_id_linkedin_content_calendar__id_fk" FOREIGN KEY ("calendar_post_id") REFERENCES "public"."linkedin_content_calendar"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_content_calendar_media" ADD CONSTRAINT "linkedin_content_calendar_media_calendar_post_id_linkedin_content_calendar__id_fk" FOREIGN KEY ("calendar_post_id") REFERENCES "public"."linkedin_content_calendar"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_content_calendar" ADD CONSTRAINT "meta_content_calendar_page_token_id_social_media_page_token__id_fk" FOREIGN KEY ("page_token_id") REFERENCES "public"."social_media_page_token"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_content_calendar" ADD CONSTRAINT "meta_content_calendar_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_content_calendar_activity_log" ADD CONSTRAINT "meta_content_calendar_activity_log_calendar_post_id_meta_content_calendar__id_fk" FOREIGN KEY ("calendar_post_id") REFERENCES "public"."meta_content_calendar"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_content_calendar_media" ADD CONSTRAINT "meta_content_calendar_media_calendar_post_id_meta_content_calendar__id_fk" FOREIGN KEY ("calendar_post_id") REFERENCES "public"."meta_content_calendar"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_integration" ADD CONSTRAINT "social_media_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_integration_activity_log" ADD CONSTRAINT "social_media_integration_activity_log_integration_id_social_media_integration__id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."social_media_integration"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_integration_id_social_media_integration__id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."social_media_integration"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_page_token_activity_log" ADD CONSTRAINT "social_media_page_token_activity_log_page_token_id_social_media_page_token__id_fk" FOREIGN KEY ("page_token_id") REFERENCES "public"."social_media_page_token"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_account" ADD CONSTRAINT "meta_ads_account_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_account_activity_log" ADD CONSTRAINT "meta_ads_account_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_account_activity_log" ADD CONSTRAINT "meta_ads_account_activity_log_account_id_meta_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_ad_set_id_meta_ads_ad_set_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."meta_ads_ad_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_campaign_id_meta_ads_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."meta_ads_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_account_id_meta_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_activity_log" ADD CONSTRAINT "meta_ads_ad_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_activity_log" ADD CONSTRAINT "meta_ads_ad_activity_log_ad_id_meta_ads_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."meta_ads_ad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_set" ADD CONSTRAINT "meta_ads_ad_set_campaign_id_meta_ads_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."meta_ads_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_set" ADD CONSTRAINT "meta_ads_ad_set_account_id_meta_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_set_activity_log" ADD CONSTRAINT "meta_ads_ad_set_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_ad_set_activity_log" ADD CONSTRAINT "meta_ads_ad_set_activity_log_ad_set_id_meta_ads_ad_set_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."meta_ads_ad_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_campaign" ADD CONSTRAINT "meta_ads_campaign_account_id_meta_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_campaign_activity_log" ADD CONSTRAINT "meta_ads_campaign_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_campaign_activity_log" ADD CONSTRAINT "meta_ads_campaign_activity_log_campaign_id_meta_ads_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."meta_ads_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_account_id_meta_ads_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_campaign_id_meta_ads_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."meta_ads_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_ad_set_id_meta_ads_ad_set_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."meta_ads_ad_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_ad_id_meta_ads_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."meta_ads_ad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_permission_key_idx" ON "agency_permission" USING btree ("key");--> statement-breakpoint
CREATE INDEX "agency_role_name_idx" ON "agency_role" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_role_permission_roleId_permissionId_unique" ON "agency_role_permission" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "agency_role_permission_roleId_idx" ON "agency_role_permission" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "agency_role_permission_permissionId_idx" ON "agency_role_permission" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "ai_chat_userId_idx" ON "ai_chat" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_chat_teamId_idx" ON "ai_chat" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "ai_chat_status_idx" ON "ai_chat" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_chat_createdAt_idx" ON "ai_chat" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_chat_userId_status_createdAt_idx" ON "ai_chat" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "ai_chat_message_chatId_idx" ON "ai_chat_message" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "ai_chat_message_createdAt_idx" ON "ai_chat_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_chat_message_chatId_createdAt_idx" ON "ai_chat_message" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_integration_userId_platform_unique" ON "customer_integration" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "customer_integration_userId_idx" ON "customer_integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_integration_platform_idx" ON "customer_integration" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "customer_integration_platformCustomerId_idx" ON "customer_integration" USING btree ("platform_customer_id");--> statement-breakpoint
CREATE INDEX "customer_integration_isActive_idx" ON "customer_integration" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "customer_integration_isCreated_idx" ON "customer_integration" USING btree ("is_created");--> statement-breakpoint
CREATE INDEX "customer_integration_activity_userId_idx" ON "customer_integration_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_integration_activity_customerIntegrationId_idx" ON "customer_integration_activity_log" USING btree ("customer_integration_id");--> statement-breakpoint
CREATE INDEX "customer_integration_activity_action_idx" ON "customer_integration_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "customer_integration_activity_createdAt_idx" ON "customer_integration_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_activity_log_userId_idx" ON "user_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_activity_log_action_idx" ON "user_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "user_activity_log_createdAt_idx" ON "user_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_profile_userId_idx" ON "user_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_asset_teamId_idx" ON "creative_asset" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "creative_asset_status_idx" ON "creative_asset" USING btree ("status");--> statement-breakpoint
CREATE INDEX "creative_asset_createdBy_idx" ON "creative_asset" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "creative_asset_isPublic_idx" ON "creative_asset" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "creative_asset_createdAt_idx" ON "creative_asset" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_asset_activity_log_creativeAssetId_idx" ON "creative_asset_activity_log" USING btree ("creative_asset_id");--> statement-breakpoint
CREATE INDEX "creative_asset_activity_log_userId_idx" ON "creative_asset_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_asset_activity_log_action_idx" ON "creative_asset_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "creative_asset_activity_log_createdAt_idx" ON "creative_asset_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_creativeAssetVersionId_idx" ON "creative_asset_comment" USING btree ("creative_asset_version_id");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_userId_idx" ON "creative_asset_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_isInternal_idx" ON "creative_asset_comment" USING btree ("is_internal");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_parentCommentId_idx" ON "creative_asset_comment" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_isResolved_idx" ON "creative_asset_comment" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "creative_asset_comment_createdAt_idx" ON "creative_asset_comment" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "creative_asset_permission_creativeAssetId_userId_unique" ON "creative_asset_permission" USING btree ("creative_asset_id","user_id");--> statement-breakpoint
CREATE INDEX "creative_asset_permission_creativeAssetId_idx" ON "creative_asset_permission" USING btree ("creative_asset_id");--> statement-breakpoint
CREATE INDEX "creative_asset_permission_userId_idx" ON "creative_asset_permission" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "creative_asset_version_creativeAssetId_internalVersionNumber_unique" ON "creative_asset_version" USING btree ("creative_asset_id","internal_version_number");--> statement-breakpoint
CREATE INDEX "creative_asset_version_creativeAssetId_idx" ON "creative_asset_version" USING btree ("creative_asset_id");--> statement-breakpoint
CREATE INDEX "creative_asset_version_internalVersionNumber_idx" ON "creative_asset_version" USING btree ("internal_version_number");--> statement-breakpoint
CREATE INDEX "creative_asset_version_publicVersionNumber_idx" ON "creative_asset_version" USING btree ("public_version_number");--> statement-breakpoint
CREATE INDEX "creative_asset_version_isPublic_idx" ON "creative_asset_version" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "creative_asset_version_internalApprovalStatus_idx" ON "creative_asset_version" USING btree ("internal_approval_status");--> statement-breakpoint
CREATE INDEX "creative_asset_version_publicApprovalStatus_idx" ON "creative_asset_version" USING btree ("public_approval_status");--> statement-breakpoint
CREATE INDEX "creative_asset_version_createdAt_idx" ON "creative_asset_version" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_asset_version_activity_creativeAssetVersionId_idx" ON "creative_asset_version_activity_log" USING btree ("creative_asset_version_id");--> statement-breakpoint
CREATE INDEX "creative_asset_version_activity_userId_idx" ON "creative_asset_version_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_asset_version_activity_action_idx" ON "creative_asset_version_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "creative_asset_version_activity_createdAt_idx" ON "creative_asset_version_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_brief_userId_idx" ON "creative_brief" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_brief_approverUserId_idx" ON "creative_brief" USING btree ("approver_user_id");--> statement-breakpoint
CREATE INDEX "creative_brief_teamId_idx" ON "creative_brief" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "creative_brief_status_idx" ON "creative_brief" USING btree ("status");--> statement-breakpoint
CREATE INDEX "creative_brief_createdAt_idx" ON "creative_brief" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_brief_activity_log_creativeBriefId_idx" ON "creative_brief_activity_log" USING btree ("creative_brief_id");--> statement-breakpoint
CREATE INDEX "creative_brief_activity_log_userId_idx" ON "creative_brief_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creative_brief_activity_log_action_idx" ON "creative_brief_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "creative_brief_activity_log_createdAt_idx" ON "creative_brief_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_brief_reference_image_creativeBriefId_idx" ON "creative_brief_reference_image" USING btree ("creative_brief_id");--> statement-breakpoint
CREATE INDEX "creative_brief_reference_image_createdAt_idx" ON "creative_brief_reference_image" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_domainName_idx" ON "domain_transfer_request" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_status_idx" ON "domain_transfer_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_createdById_idx" ON "domain_transfer_request" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_teamId_idx" ON "domain_transfer_request" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_createdAt_idx" ON "domain_transfer_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_transfer_request_niscOrderId_idx" ON "domain_transfer_request" USING btree ("nisc_order_id");--> statement-breakpoint
CREATE INDEX "domain_domainName_idx" ON "domain" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "domain_userId_idx" ON "domain" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domain_teamId_idx" ON "domain" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_openProviderId_idx" ON "domain" USING btree ("open_provider_id");--> statement-breakpoint
CREATE INDEX "domain_registrationDate_idx" ON "domain" USING btree ("registration_date");--> statement-breakpoint
CREATE INDEX "domain_expirationDate_idx" ON "domain" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "domain_activity_log_userId_idx" ON "domain_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domain_activity_log_domainId_idx" ON "domain_activity_log" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "domain_activity_log_teamId_idx" ON "domain_activity_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_activity_log_action_idx" ON "domain_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "domain_activity_log_createdAt_idx" ON "domain_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_renewal_domainId_idx" ON "domain_renewal" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "domain_renewal_renewalDate_idx" ON "domain_renewal" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "domain_renewal_renewedBy_idx" ON "domain_renewal" USING btree ("renewed_by");--> statement-breakpoint
CREATE INDEX "domain_renewal_teamId_idx" ON "domain_renewal" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_renewal_activity_log_userId_idx" ON "domain_renewal_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domain_renewal_activity_log_domainRenewalId_idx" ON "domain_renewal_activity_log" USING btree ("domain_renewal_id");--> statement-breakpoint
CREATE INDEX "domain_renewal_activity_log_teamId_idx" ON "domain_renewal_activity_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_renewal_activity_log_action_idx" ON "domain_renewal_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "domain_renewal_activity_log_createdAt_idx" ON "domain_renewal_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_transfer_domainId_idx" ON "domain_transfer" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_status_idx" ON "domain_transfer" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domain_transfer_transferRequestedAt_idx" ON "domain_transfer" USING btree ("transfer_requested_at");--> statement-breakpoint
CREATE INDEX "domain_transfer_transferredBy_idx" ON "domain_transfer" USING btree ("transferred_by");--> statement-breakpoint
CREATE INDEX "domain_transfer_createdById_idx" ON "domain_transfer" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_teamId_idx" ON "domain_transfer" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_activity_log_userId_idx" ON "domain_transfer_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_activity_log_domainTransferId_idx" ON "domain_transfer_activity_log" USING btree ("domain_transfer_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_activity_log_teamId_idx" ON "domain_transfer_activity_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "domain_transfer_activity_log_action_idx" ON "domain_transfer_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "domain_transfer_activity_log_createdAt_idx" ON "domain_transfer_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_builder_design_userId_idx" ON "email_builder_design" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_builder_design_teamId_idx" ON "email_builder_design" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_builder_design_isPublic_idx" ON "email_builder_design" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "email_builder_design_activity_emailBuilderDesignId_idx" ON "email_builder_design_activity_log" USING btree ("email_builder_design_id");--> statement-breakpoint
CREATE INDEX "email_builder_design_activity_userId_idx" ON "email_builder_design_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_builder_design_activity_action_idx" ON "email_builder_design_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "email_builder_design_activity_createdAt_idx" ON "email_builder_design_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_builder_library_userId_idx" ON "email_builder_library" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_builder_library_teamId_idx" ON "email_builder_library" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_builder_library_createdAt_idx" ON "email_builder_library" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaign_recipient_campaignId_idx" ON "campaign_recipient" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_recipient_toEmail_idx" ON "campaign_recipient" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "campaign_recipient_resendId_idx" ON "campaign_recipient" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX "email_audience_userId_idx" ON "email_audience" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_audience_teamId_idx" ON "email_audience" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_audience_createdAt_idx" ON "email_audience" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_audience_contact_audienceId_idx" ON "email_audience_contact" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "email_audience_contact_emailAddress_idx" ON "email_audience_contact" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "email_audience_contact_status_idx" ON "email_audience_contact" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaign_emailDomainId_idx" ON "email_campaign" USING btree ("email_domain_id");--> statement-breakpoint
CREATE INDEX "email_campaign_userId_idx" ON "email_campaign" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_campaign_teamId_idx" ON "email_campaign" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_campaign_status_idx" ON "email_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaign_scheduledAt_idx" ON "email_campaign" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_campaign_activity_log_userId_idx" ON "email_campaign_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_campaign_activity_log_campaignId_idx" ON "email_campaign_activity_log" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_campaign_activity_log_action_idx" ON "email_campaign_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "email_campaign_activity_log_createdAt_idx" ON "email_campaign_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_campaign_send_job_campaignId_idx" ON "email_campaign_send_job" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_campaign_send_job_status_idx" ON "email_campaign_send_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaign_send_job_scheduledFor_idx" ON "email_campaign_send_job" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "email_campaign_send_job_qstashMessageId_idx" ON "email_campaign_send_job" USING btree ("qstash_message_id");--> statement-breakpoint
CREATE INDEX "email_domain_userId_idx" ON "email_domain" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_domain_teamId_idx" ON "email_domain" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_domain_status_idx" ON "email_domain" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_domain_domainName_idx" ON "email_domain" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "email_domain_activity_log_userId_idx" ON "email_domain_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_domain_activity_log_emailDomainId_idx" ON "email_domain_activity_log" USING btree ("email_domain_id");--> statement-breakpoint
CREATE INDEX "email_domain_activity_log_action_idx" ON "email_domain_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "email_domain_activity_log_createdAt_idx" ON "email_domain_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_event_campaignRecipientId_idx" ON "email_event" USING btree ("campaign_recipient_id");--> statement-breakpoint
CREATE INDEX "email_event_type_idx" ON "email_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_event_eventCreatedAt_idx" ON "email_event" USING btree ("event_created_at");--> statement-breakpoint
CREATE INDEX "email_event_resendEmailId_idx" ON "email_event" USING btree ("resend_email_id");--> statement-breakpoint
CREATE INDEX "email_event_activity_log_emailEventId_idx" ON "email_event_activity_log" USING btree ("email_event_id");--> statement-breakpoint
CREATE INDEX "email_event_activity_log_action_idx" ON "email_event_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "email_event_activity_log_createdAt_idx" ON "email_event_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "etims_configuration_kraPin_branchId_idx" ON "etims_configuration" USING btree ("kra_pin","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "etims_item_itemCd_unique" ON "etims_item" USING btree ("item_cd");--> statement-breakpoint
CREATE UNIQUE INDEX "google_ads_account_integrationId_customerId_unique" ON "google_ads_account" USING btree ("integration_id","customer_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_integrationId_idx" ON "google_ads_account" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_customerId_idx" ON "google_ads_account" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_status_idx" ON "google_ads_account" USING btree ("status");--> statement-breakpoint
CREATE INDEX "google_ads_account_teamId_idx" ON "google_ads_account" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_activity_log_userId_idx" ON "google_ads_account_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_activity_log_accountId_idx" ON "google_ads_account_activity_log" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "google_ads_account_activity_log_action_idx" ON "google_ads_account_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "google_ads_account_activity_log_createdAt_idx" ON "google_ads_account_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "google_ads_integration_status_idx" ON "google_ads_integration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "google_ads_integration_userId_idx" ON "google_ads_integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "google_ads_integration_activity_log_userId_idx" ON "google_ads_integration_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "google_ads_integration_activity_log_integrationId_idx" ON "google_ads_integration_activity_log" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "google_ads_integration_activity_log_action_idx" ON "google_ads_integration_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "google_ads_integration_activity_log_createdAt_idx" ON "google_ads_integration_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hosting_plan_hostingType_idx" ON "hosting_plan" USING btree ("hosting_type");--> statement-breakpoint
CREATE INDEX "hosting_plan_isActive_idx" ON "hosting_plan" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "hosting_plan_activity_userId_idx" ON "hosting_plan_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hosting_plan_activity_hostingPlanId_idx" ON "hosting_plan_activity_log" USING btree ("hosting_plan_id");--> statement-breakpoint
CREATE INDEX "hosting_plan_activity_action_idx" ON "hosting_plan_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "hosting_plan_activity_createdAt_idx" ON "hosting_plan_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hosting_renewal_hostingSubscriptionId_idx" ON "hosting_renewal" USING btree ("hosting_subscription_id");--> statement-breakpoint
CREATE INDEX "hosting_renewal_renewalDate_idx" ON "hosting_renewal" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "hosting_renewal_expiryDate_idx" ON "hosting_renewal" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "hosting_renewal_renewedBy_idx" ON "hosting_renewal" USING btree ("renewed_by");--> statement-breakpoint
CREATE INDEX "hosting_renewal_activity_userId_idx" ON "hosting_renewal_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hosting_renewal_activity_hostingRenewalId_idx" ON "hosting_renewal_activity_log" USING btree ("hosting_renewal_id");--> statement-breakpoint
CREATE INDEX "hosting_renewal_activity_action_idx" ON "hosting_renewal_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "hosting_renewal_activity_createdAt_idx" ON "hosting_renewal_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hosting_subscription_hostingPlanId_idx" ON "hosting_subscription" USING btree ("hosting_plan_id");--> statement-breakpoint
CREATE INDEX "hosting_subscription_teamId_idx" ON "hosting_subscription" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "hosting_subscription_pleskFilterId_idx" ON "hosting_subscription" USING btree ("plesk_filter_id");--> statement-breakpoint
CREATE INDEX "hosting_subscription_status_idx" ON "hosting_subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hosting_subscription_nextRenewalDate_idx" ON "hosting_subscription" USING btree ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "hosting_subscription_expiryDate_idx" ON "hosting_subscription" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "hosting_subscription_primaryDomain_idx" ON "hosting_subscription" USING btree ("primary_domain");--> statement-breakpoint
CREATE INDEX "hosting_subscription_activity_userId_idx" ON "hosting_subscription_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hosting_subscription_activity_hostingSubscriptionId_idx" ON "hosting_subscription_activity_log" USING btree ("hosting_subscription_id");--> statement-breakpoint
CREATE INDEX "hosting_subscription_activity_action_idx" ON "hosting_subscription_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "hosting_subscription_activity_createdAt_idx" ON "hosting_subscription_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_planType_idx" ON "nisc_service_plan" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_hostingSubType_idx" ON "nisc_service_plan" USING btree ("hosting_sub_type");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_isActive_idx" ON "nisc_service_plan" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_isDefault_idx" ON "nisc_service_plan" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_activity_userId_idx" ON "nisc_service_plan_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_activity_niscServicePlanId_idx" ON "nisc_service_plan_activity_log" USING btree ("nisc_service_plan_id");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_activity_action_idx" ON "nisc_service_plan_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nisc_service_plan_activity_createdAt_idx" ON "nisc_service_plan_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wordpress_instance_teamId_idx" ON "wordpress_instance" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "wordpress_instance_installationId_idx" ON "wordpress_instance" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "wordpress_instance_activity_userId_idx" ON "wordpress_instance_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wordpress_instance_activity_wordpressInstanceId_idx" ON "wordpress_instance_activity_log" USING btree ("wordpress_instance_id");--> statement-breakpoint
CREATE INDEX "wordpress_instance_activity_action_idx" ON "wordpress_instance_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "wordpress_instance_activity_createdAt_idx" ON "wordpress_instance_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "background_remover_generation_userId_idx" ON "background_remover_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "background_remover_generation_teamId_idx" ON "background_remover_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "background_remover_generation_createdAt_idx" ON "background_remover_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "background_remover_generation_modelId_idx" ON "background_remover_generation" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "background_remover_generation_status_idx" ON "background_remover_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "background_remover_activity_backgroundRemoverGenerationId_idx" ON "background_remover_generation_activity_log" USING btree ("background_remover_generation_id");--> statement-breakpoint
CREATE INDEX "background_remover_activity_userId_idx" ON "background_remover_generation_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "background_remover_activity_action_idx" ON "background_remover_generation_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "background_remover_activity_createdAt_idx" ON "background_remover_generation_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_generator_generation_userId_idx" ON "image_generator_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_generator_generation_teamId_idx" ON "image_generator_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "image_generator_generation_createdAt_idx" ON "image_generator_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_generator_generation_modelId_idx" ON "image_generator_generation" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "image_generator_generation_status_idx" ON "image_generator_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_gen_generation_activity_imageGeneratorGenerationId_idx" ON "image_generator_generation_activity_log" USING btree ("image_generator_generation_id");--> statement-breakpoint
CREATE INDEX "image_gen_generation_activity_userId_idx" ON "image_generator_generation_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_gen_generation_activity_action_idx" ON "image_generator_generation_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "image_gen_generation_activity_createdAt_idx" ON "image_generator_generation_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_generator_variation_imageGeneratorGenerationId_idx" ON "image_generator_variation" USING btree ("image_generator_generation_id");--> statement-breakpoint
CREATE INDEX "image_generator_variation_variationIndex_idx" ON "image_generator_variation" USING btree ("variation_index");--> statement-breakpoint
CREATE INDEX "image_generator_variation_status_idx" ON "image_generator_variation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_generator_variation_predictionId_idx" ON "image_generator_variation" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_userId_idx" ON "imagegen_ai_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_teamId_idx" ON "imagegen_ai_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_createdAt_idx" ON "imagegen_ai_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_modelId_idx" ON "imagegen_ai_generation" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_activity_log_imageGenAiGenerationId_idx" ON "imagegen_ai_generation_activity_log" USING btree ("image_gen_ai_generation_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_activity_log_userId_idx" ON "imagegen_ai_generation_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_activity_log_action_idx" ON "imagegen_ai_generation_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "imagegen_ai_generation_activity_log_createdAt_idx" ON "imagegen_ai_generation_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "imagegen_project_userId_idx" ON "imagegen_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_project_teamId_idx" ON "imagegen_project" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "imagegen_project_activity_log_imageGenProjectId_idx" ON "imagegen_project_activity_log" USING btree ("image_gen_project_id");--> statement-breakpoint
CREATE INDEX "imagegen_project_activity_log_userId_idx" ON "imagegen_project_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_project_activity_log_action_idx" ON "imagegen_project_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "imagegen_project_activity_log_createdAt_idx" ON "imagegen_project_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "imagegen_template_userId_idx" ON "imagegen_template" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_template_isPublic_idx" ON "imagegen_template" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "imagegen_template_activity_log_imageGenTemplateId_idx" ON "imagegen_template_activity_log" USING btree ("image_gen_template_id");--> statement-breakpoint
CREATE INDEX "imagegen_template_activity_log_userId_idx" ON "imagegen_template_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_template_activity_log_action_idx" ON "imagegen_template_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "imagegen_template_activity_log_createdAt_idx" ON "imagegen_template_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "imagegen_upload_userId_idx" ON "imagegen_upload" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_upload_teamId_idx" ON "imagegen_upload" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "imagegen_upload_createdAt_idx" ON "imagegen_upload" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "imagegen_upload_activity_log_imageGenUploadId_idx" ON "imagegen_upload_activity_log" USING btree ("image_gen_upload_id");--> statement-breakpoint
CREATE INDEX "imagegen_upload_activity_log_userId_idx" ON "imagegen_upload_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "imagegen_upload_activity_log_action_idx" ON "imagegen_upload_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "imagegen_upload_activity_log_createdAt_idx" ON "imagegen_upload_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_slug_idx" ON "team" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "team_createdById_idx" ON "team" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "team_isActive_idx" ON "team" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "team_billing_settings_teamId_idx" ON "team_billing_settings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_billing_settings_activity_teamBillingSettingsId_idx" ON "team_billing_settings_activity_log" USING btree ("team_billing_settings_id");--> statement-breakpoint
CREATE INDEX "team_billing_settings_activity_userId_idx" ON "team_billing_settings_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_billing_settings_activity_action_idx" ON "team_billing_settings_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "team_billing_settings_activity_createdAt_idx" ON "team_billing_settings_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_invite_code_idx" ON "team_invite" USING btree ("code");--> statement-breakpoint
CREATE INDEX "team_invite_teamId_idx" ON "team_invite" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invite_email_idx" ON "team_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "team_invite_status_idx" ON "team_invite" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_invite_expiresAt_idx" ON "team_invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "team_member_teamId_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_userId_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_note_teamId_idx" ON "invoice_credit_note" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "credit_note_status_idx" ON "invoice_credit_note" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_note_issuedAt_idx" ON "invoice_credit_note" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "credit_note_activity_log_creditNoteId_idx" ON "invoice_credit_note_activity_log" USING btree ("credit_note_id");--> statement-breakpoint
CREATE INDEX "credit_note_activity_log_userId_idx" ON "invoice_credit_note_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_note_activity_log_action_idx" ON "invoice_credit_note_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "credit_note_activity_log_createdAt_idx" ON "invoice_credit_note_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_teamId_invoiceNumber_unique" ON "invoice" USING btree ("team_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_teamId_idx" ON "invoice" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_dueDate_idx" ON "invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoice_sentAt_idx" ON "invoice" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "invoice_invoiceNumber_idx" ON "invoice" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_activity_log_invoiceId_idx" ON "invoice_activity_log" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_activity_log_userId_idx" ON "invoice_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoice_activity_log_action_idx" ON "invoice_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "invoice_activity_log_createdAt_idx" ON "invoice_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoice_line_item_invoiceId_idx" ON "invoice_line_item" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_line_item_position_idx" ON "invoice_line_item" USING btree ("position");--> statement-breakpoint
CREATE INDEX "invoice_transaction_invoiceId_idx" ON "invoice_transaction" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_transaction_status_idx" ON "invoice_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_transaction_paidAt_idx" ON "invoice_transaction" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "invoice_transaction_activity_log_invoiceTransactionId_idx" ON "invoice_transaction_activity_log" USING btree ("invoice_transaction_id");--> statement-breakpoint
CREATE INDEX "invoice_transaction_activity_log_userId_idx" ON "invoice_transaction_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoice_transaction_activity_log_action_idx" ON "invoice_transaction_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "invoice_transaction_activity_log_createdAt_idx" ON "invoice_transaction_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_createdById_idx" ON "ticket" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "ticket_teamId_idx" ON "ticket" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "ticket_assignedToId_idx" ON "ticket" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "ticket_status_idx" ON "ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ticket_priority_idx" ON "ticket" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "ticket_type_idx" ON "ticket" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ticket_ticketNumber_idx" ON "ticket" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "ticket_createdAt_idx" ON "ticket" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_lastMessageAt_idx" ON "ticket" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "ticket_status_priority_idx" ON "ticket" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "ticket_teamId_status_idx" ON "ticket" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "ticket_assignedToId_status_idx" ON "ticket" USING btree ("assigned_to_id","status");--> statement-breakpoint
CREATE INDEX "ticket_activity_log_ticketId_idx" ON "ticket_activity_log" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_activity_log_userId_idx" ON "ticket_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ticket_activity_log_action_idx" ON "ticket_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ticket_activity_log_createdAt_idx" ON "ticket_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_activity_log_ticketId_createdAt_idx" ON "ticket_activity_log" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_attachment_ticketId_idx" ON "ticket_attachment" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_attachment_messageId_idx" ON "ticket_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ticket_attachment_uploadedById_idx" ON "ticket_attachment" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "ticket_attachment_createdAt_idx" ON "ticket_attachment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_message_ticketId_idx" ON "ticket_message" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_message_senderId_idx" ON "ticket_message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "ticket_message_createdAt_idx" ON "ticket_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ticket_message_ticketId_createdAt_idx" ON "ticket_message" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_message_isInternal_idx" ON "ticket_message" USING btree ("is_internal");--> statement-breakpoint
CREATE INDEX "ticket_message_deletedAt_idx" ON "ticket_message" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "ticket_message_readStatus_idx" ON "ticket_message" USING btree ("read_status");--> statement-breakpoint
CREATE INDEX "ticket_tag_name_idx" ON "ticket_tag" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_tag_relation_ticketId_tagId_unique" ON "ticket_tag_relation" USING btree ("ticket_id","tag_id");--> statement-breakpoint
CREATE INDEX "ticket_tag_relation_ticketId_idx" ON "ticket_tag_relation" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_tag_relation_tagId_idx" ON "ticket_tag_relation" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "web_design_quote_request_status_idx" ON "web_design_quote_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "web_design_quote_request_submittedById_idx" ON "web_design_quote_request" USING btree ("submitted_by_id");--> statement-breakpoint
CREATE INDEX "web_design_quote_request_createdAt_idx" ON "web_design_quote_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "web_design_quote_request_email_idx" ON "web_design_quote_request" USING btree ("email");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_userId_idx" ON "nisc_client_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_teamId_idx" ON "nisc_client_subscription" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_productId_idx" ON "nisc_client_subscription" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_productPlanId_idx" ON "nisc_client_subscription" USING btree ("product_plan_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_orderId_idx" ON "nisc_client_subscription" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_niscOrderId_idx" ON "nisc_client_subscription" USING btree ("nisc_order_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_status_idx" ON "nisc_client_subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_upgradedToSubscriptionId_idx" ON "nisc_client_subscription" USING btree ("upgraded_to_subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_downgradedToSubscriptionId_idx" ON "nisc_client_subscription" USING btree ("downgraded_to_subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_pricingModel_idx" ON "nisc_client_subscription" USING btree ("pricing_model");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_pleskFilterId_idx" ON "nisc_client_subscription" USING btree ("plesk_filter_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_openProviderId_idx" ON "nisc_client_subscription" USING btree ("open_provider_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_primaryDomain_idx" ON "nisc_client_subscription" USING btree ("primary_domain");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_nextRenewalDate_idx" ON "nisc_client_subscription" USING btree ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_expiryDate_idx" ON "nisc_client_subscription" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_subscriptionDate_idx" ON "nisc_client_subscription" USING btree ("subscription_date");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_activity_subscriptionId_idx" ON "nisc_client_subscription_activity_log" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_activity_userId_idx" ON "nisc_client_subscription_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_activity_action_idx" ON "nisc_client_subscription_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_activity_createdAt_idx" ON "nisc_client_subscription_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_renewal_subscriptionId_idx" ON "nisc_client_subscription_renewal" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_renewal_renewalType_idx" ON "nisc_client_subscription_renewal" USING btree ("renewal_type");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_renewal_renewalDate_idx" ON "nisc_client_subscription_renewal" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_renewal_newExpiryDate_idx" ON "nisc_client_subscription_renewal" USING btree ("new_expiry_date");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_renewal_status_idx" ON "nisc_client_subscription_renewal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_renewal_activity_renewalId_idx" ON "nisc_client_subscription_renewal_activity_log" USING btree ("renewal_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_renewal_activity_userId_idx" ON "nisc_client_subscription_renewal_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_renewal_activity_action_idx" ON "nisc_client_subscription_renewal_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_renewal_activity_createdAt_idx" ON "nisc_client_subscription_renewal_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_client_subscription_usage_subscriptionId_usageKind_unique" ON "nisc_client_subscription_usage" USING btree ("subscription_id","usage_kind");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_usage_subscriptionId_idx" ON "nisc_client_subscription_usage" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_usage_usageKind_idx" ON "nisc_client_subscription_usage" USING btree ("usage_kind");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_usage_activity_subscriptionUsageId_idx" ON "nisc_client_subscription_usage_activity_log" USING btree ("subscription_usage_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_usage_activity_userId_idx" ON "nisc_client_subscription_usage_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_usage_activity_action_idx" ON "nisc_client_subscription_usage_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nisc_client_sub_usage_activity_createdAt_idx" ON "nisc_client_subscription_usage_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_product_category_idx" ON "nisc_product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "nisc_product_serviceType_idx" ON "nisc_product" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "nisc_product_isActive_idx" ON "nisc_product" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nisc_product_isAddOn_idx" ON "nisc_product" USING btree ("is_add_on");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_product_add_on_productId_baseProductId_unique" ON "nisc_product_add_on" USING btree ("product_id","base_product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_add_on_productId_idx" ON "nisc_product_add_on" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_add_on_baseProductId_idx" ON "nisc_product_add_on" USING btree ("base_product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_productId_idx" ON "nisc_product_plan" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_pricingModel_idx" ON "nisc_product_plan" USING btree ("pricing_model");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_isActive_idx" ON "nisc_product_plan" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_isDefault_idx" ON "nisc_product_plan" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_usage_productId_idx" ON "nisc_product_plan_usage" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_usage_productPlanId_idx" ON "nisc_product_plan_usage" USING btree ("product_plan_id");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_usage_usageKind_idx" ON "nisc_product_plan_usage" USING btree ("usage_kind");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_usage_userId_idx" ON "nisc_product_plan_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_usage_teamId_idx" ON "nisc_product_plan_usage" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_code_idx" ON "nisc_product_promo" USING btree ("code");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_productId_idx" ON "nisc_product_promo" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_productPlanId_idx" ON "nisc_product_promo" USING btree ("product_plan_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_isActive_idx" ON "nisc_product_promo" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_startDate_idx" ON "nisc_product_promo" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_endDate_idx" ON "nisc_product_promo" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_promoId_idx" ON "nisc_product_promo_redeem" USING btree ("promo_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_redeemedAt_idx" ON "nisc_product_promo_redeem" USING btree ("redeemed_at");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_userId_idx" ON "nisc_product_promo_redeem" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_teamId_idx" ON "nisc_product_promo_redeem" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_orderId_idx" ON "nisc_product_promo_redeem" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_subscriptionId_idx" ON "nisc_product_promo_redeem" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_product_promo_redeem_renewalId_idx" ON "nisc_product_promo_redeem" USING btree ("renewal_id");--> statement-breakpoint
CREATE INDEX "nameserver_nameserverGroupId_idx" ON "nameserver" USING btree ("nameserver_group_id");--> statement-breakpoint
CREATE INDEX "nameserver_name_idx" ON "nameserver" USING btree ("name");--> statement-breakpoint
CREATE INDEX "nameserver_activity_userId_idx" ON "nameserver_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nameserver_activity_nameserverId_idx" ON "nameserver_activity_log" USING btree ("nameserver_id");--> statement-breakpoint
CREATE INDEX "nameserver_activity_action_idx" ON "nameserver_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nameserver_activity_createdAt_idx" ON "nameserver_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nameserver_group_userId_idx" ON "nameserver_group" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nameserver_group_isDefault_idx" ON "nameserver_group" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "nameserver_group_activity_userId_idx" ON "nameserver_group_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nameserver_group_activity_nameserverGroupId_idx" ON "nameserver_group_activity_log" USING btree ("nameserver_group_id");--> statement-breakpoint
CREATE INDEX "nameserver_group_activity_action_idx" ON "nameserver_group_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "nameserver_group_activity_createdAt_idx" ON "nameserver_group_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tld_settings_userId_idx" ON "tld_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tld_settings_nameserverGroupId_idx" ON "tld_settings" USING btree ("nameserver_group_id");--> statement-breakpoint
CREATE INDEX "tld_settings_marginType_idx" ON "tld_settings" USING btree ("margin_type");--> statement-breakpoint
CREATE INDEX "tld_settings_isDefault_idx" ON "tld_settings" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "tld_settings_activity_userId_idx" ON "tld_settings_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tld_settings_activity_tldSettingId_idx" ON "tld_settings_activity_log" USING btree ("tld_setting_id");--> statement-breakpoint
CREATE INDEX "tld_settings_activity_action_idx" ON "tld_settings_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "tld_settings_activity_createdAt_idx" ON "tld_settings_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "promo_code_idx" ON "promo" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_target_idx" ON "promo" USING btree ("target");--> statement-breakpoint
CREATE INDEX "promo_scope_idx" ON "promo" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "promo_isActive_idx" ON "promo" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "promo_startDate_idx" ON "promo" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "promo_endDate_idx" ON "promo" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "promo_hostingPlanId_idx" ON "promo" USING btree ("hosting_plan_id");--> statement-breakpoint
CREATE INDEX "promo_userId_idx" ON "promo" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promo_activity_log_userId_idx" ON "promo_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promo_activity_log_promoId_idx" ON "promo_activity_log" USING btree ("promo_id");--> statement-breakpoint
CREATE INDEX "promo_activity_log_action_idx" ON "promo_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "promo_activity_log_createdAt_idx" ON "promo_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_order_userId_idx" ON "nisc_order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_order_teamId_idx" ON "nisc_order" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_order_status_idx" ON "nisc_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_order_createdAt_idx" ON "nisc_order" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_order_qstashMessageId_idx" ON "nisc_order" USING btree ("qstash_message_id");--> statement-breakpoint
CREATE INDEX "nisc_order_paymentTransactionId_idx" ON "nisc_order" USING btree ("payment_transaction_id");--> statement-breakpoint
CREATE INDEX "nisc_order_item_niscOrderId_idx" ON "nisc_order_item" USING btree ("nisc_order_id");--> statement-breakpoint
CREATE INDEX "nisc_order_item_productId_idx" ON "nisc_order_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "nisc_order_item_productPlanId_idx" ON "nisc_order_item" USING btree ("product_plan_id");--> statement-breakpoint
CREATE INDEX "nisc_order_item_status_idx" ON "nisc_order_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_order_item_niscClientSubscriptionId_idx" ON "nisc_order_item" USING btree ("nisc_client_subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_order_processing_log_niscOrderId_idx" ON "nisc_order_processing_log" USING btree ("nisc_order_id");--> statement-breakpoint
CREATE INDEX "nisc_order_processing_log_niscOrderId_createdAt_idx" ON "nisc_order_processing_log" USING btree ("nisc_order_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_teamId_idx" ON "notification" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_seen_idx" ON "notification" USING btree ("seen");--> statement-breakpoint
CREATE INDEX "notification_priority_idx" ON "notification" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_userId_seen_idx" ON "notification" USING btree ("user_id","seen");--> statement-breakpoint
CREATE INDEX "notification_teamId_seen_idx" ON "notification" USING btree ("team_id","seen");--> statement-breakpoint
CREATE INDEX "notification_activity_log_notificationId_idx" ON "notification_activity_log" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_activity_log_userId_idx" ON "notification_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_activity_log_action_idx" ON "notification_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "notification_activity_log_createdAt_idx" ON "notification_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_orderNumber_idx" ON "order" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "order_teamId_idx" ON "order" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "order_type_idx" ON "order" USING btree ("type");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_createdAt_idx" ON "order" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_processedAt_idx" ON "order" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "order_completedAt_idx" ON "order" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "order_invoiceId_idx" ON "order" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "order_niscProductPromoId_idx" ON "order" USING btree ("nisc_product_promo_id");--> statement-breakpoint
CREATE INDEX "order_activity_log_userId_idx" ON "order_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_activity_log_orderId_idx" ON "order_activity_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_activity_log_action_idx" ON "order_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "order_activity_log_createdAt_idx" ON "order_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_item_orderId_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_niscServicePlanId_idx" ON "order_item" USING btree ("nisc_service_plan_id");--> statement-breakpoint
CREATE INDEX "order_item_status_idx" ON "order_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_item_isProvisioned_idx" ON "order_item" USING btree ("is_provisioned");--> statement-breakpoint
CREATE INDEX "order_item_hostingSubscriptionId_idx" ON "order_item" USING btree ("hosting_subscription_id");--> statement-breakpoint
CREATE INDEX "order_item_activity_log_orderItemId_idx" ON "order_item_activity_log" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_item_activity_log_userId_idx" ON "order_item_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_item_activity_log_action_idx" ON "order_item_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "order_item_activity_log_createdAt_idx" ON "order_item_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_transaction_userId_idx" ON "payment_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_teamId_idx" ON "payment_transaction" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_gateway_idx" ON "payment_transaction" USING btree ("gateway");--> statement-breakpoint
CREATE INDEX "payment_transaction_status_idx" ON "payment_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_transaction_gatewayTransactionId_idx" ON "payment_transaction" USING btree ("gateway_transaction_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_checkoutRequestId_idx" ON "payment_transaction" USING btree ("checkout_request_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_merchantRequestId_idx" ON "payment_transaction" USING btree ("merchant_request_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_receiptNumber_idx" ON "payment_transaction" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "payment_transaction_accountReference_idx" ON "payment_transaction" USING btree ("account_reference");--> statement-breakpoint
CREATE INDEX "payment_transaction_initiatedAt_idx" ON "payment_transaction" USING btree ("initiated_at");--> statement-breakpoint
CREATE INDEX "payment_transaction_processedAt_idx" ON "payment_transaction" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "payment_transaction_createdAt_idx" ON "payment_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_transaction_activity_log_transactionId_idx" ON "payment_transaction_activity_log" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_activity_log_userId_idx" ON "payment_transaction_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_transaction_activity_log_action_idx" ON "payment_transaction_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "payment_transaction_activity_log_createdAt_idx" ON "payment_transaction_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "quotation_quotationNumber_idx" ON "quotation" USING btree ("quotation_number");--> statement-breakpoint
CREATE INDEX "quotation_status_idx" ON "quotation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotation_createdBy_idx" ON "quotation" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "quotation_issueDate_idx" ON "quotation" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "quotation_activity_log_quotationId_idx" ON "quotation_activity_log" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotation_activity_log_userId_idx" ON "quotation_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quotation_activity_log_action_idx" ON "quotation_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "quotation_activity_log_createdAt_idx" ON "quotation_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "quotation_line_item_quotationId_idx" ON "quotation_line_item" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotation_line_item_position_idx" ON "quotation_line_item" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "creative_production_snapshot_date_period_unique" ON "creative_production_snapshot" USING btree ("date","period");--> statement-breakpoint
CREATE INDEX "creative_production_snapshot_date_period_idx" ON "creative_production_snapshot" USING btree ("date","period");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_by_service_snapshot_date_period_serviceType_currency_unique" ON "revenue_by_service_snapshot" USING btree ("date","period","service_type","currency");--> statement-breakpoint
CREATE INDEX "revenue_by_service_snapshot_date_period_serviceType_idx" ON "revenue_by_service_snapshot" USING btree ("date","period","service_type");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_by_team_snapshot_date_period_teamId_currency_unique" ON "revenue_by_team_snapshot" USING btree ("date","period","team_id","currency");--> statement-breakpoint
CREATE INDEX "revenue_by_team_snapshot_date_period_idx" ON "revenue_by_team_snapshot" USING btree ("date","period");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_report_snapshot_date_period_currency_unique" ON "sales_report_snapshot" USING btree ("date","period","currency");--> statement-breakpoint
CREATE INDEX "sales_report_snapshot_date_period_idx" ON "sales_report_snapshot" USING btree ("date","period");--> statement-breakpoint
CREATE INDEX "seo_report_userId_idx" ON "seo_report" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seo_report_teamId_idx" ON "seo_report" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "seo_report_reportYear_reportMonth_idx" ON "seo_report" USING btree ("report_year","report_month");--> statement-breakpoint
CREATE INDEX "seo_report_reportName_idx" ON "seo_report" USING btree ("report_name");--> statement-breakpoint
CREATE INDEX "seo_report_status_idx" ON "seo_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_report_createdAt_idx" ON "seo_report" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seo_report_teamId_reportYear_reportMonth_idx" ON "seo_report" USING btree ("team_id","report_year","report_month");--> statement-breakpoint
CREATE INDEX "seo_report_activity_log_seoReportId_idx" ON "seo_report_activity_log" USING btree ("seo_report_id");--> statement-breakpoint
CREATE INDEX "seo_report_activity_log_userId_idx" ON "seo_report_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seo_report_activity_log_action_idx" ON "seo_report_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "seo_report_activity_log_createdAt_idx" ON "seo_report_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "service_subscription_niscServicePlanId_idx" ON "service_subscription" USING btree ("nisc_service_plan_id");--> statement-breakpoint
CREATE INDEX "service_subscription_teamId_idx" ON "service_subscription" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "service_subscription_orderId_idx" ON "service_subscription" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "service_subscription_status_idx" ON "service_subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_subscription_nextRenewalDate_idx" ON "service_subscription" USING btree ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "service_subscription_subscriptionDate_idx" ON "service_subscription" USING btree ("subscription_date");--> statement-breakpoint
CREATE INDEX "service_subscription_hostingSubscriptionId_idx" ON "service_subscription" USING btree ("hosting_subscription_id");--> statement-breakpoint
CREATE INDEX "service_subscription_activity_log_serviceSubscriptionId_idx" ON "service_subscription_activity_log" USING btree ("service_subscription_id");--> statement-breakpoint
CREATE INDEX "service_subscription_activity_log_userId_idx" ON "service_subscription_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_subscription_activity_log_action_idx" ON "service_subscription_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "service_subscription_activity_log_createdAt_idx" ON "service_subscription_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "service_subscription_renewal_serviceSubscriptionId_idx" ON "service_subscription_renewal" USING btree ("service_subscription_id");--> statement-breakpoint
CREATE INDEX "service_subscription_renewal_orderId_idx" ON "service_subscription_renewal" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "service_subscription_renewal_renewalDate_idx" ON "service_subscription_renewal" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "service_subscription_renewal_nextRenewalDate_idx" ON "service_subscription_renewal" USING btree ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "service_sub_renewal_activity_log_serviceSubscriptionRenewalId_idx" ON "service_subscription_renewal_activity_log" USING btree ("service_subscription_renewal_id");--> statement-breakpoint
CREATE INDEX "service_sub_renewal_activity_log_userId_idx" ON "service_subscription_renewal_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_sub_renewal_activity_log_action_idx" ON "service_subscription_renewal_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "service_sub_renewal_activity_log_createdAt_idx" ON "service_subscription_renewal_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_pageTokenId_idx" ON "linkedin_content_calendar" USING btree ("page_token_id");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_status_idx" ON "linkedin_content_calendar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_scheduledPublishTime_idx" ON "linkedin_content_calendar" USING btree ("scheduled_publish_time");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_published_idx" ON "linkedin_content_calendar" USING btree ("published");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_createdBy_idx" ON "linkedin_content_calendar" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_createdAt_idx" ON "linkedin_content_calendar" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_activity_log_userId_idx" ON "linkedin_content_calendar_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_activity_log_calendarPostId_idx" ON "linkedin_content_calendar_activity_log" USING btree ("calendar_post_id");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_activity_log_action_idx" ON "linkedin_content_calendar_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_activity_log_createdAt_idx" ON "linkedin_content_calendar_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_media_calendarPostId_idx" ON "linkedin_content_calendar_media" USING btree ("calendar_post_id");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_media_mediaType_idx" ON "linkedin_content_calendar_media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "linkedin_content_calendar_media_order_idx" ON "linkedin_content_calendar_media" USING btree ("order");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_pageTokenId_idx" ON "meta_content_calendar" USING btree ("page_token_id");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_status_idx" ON "meta_content_calendar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_scheduledPublishTime_idx" ON "meta_content_calendar" USING btree ("scheduled_publish_time");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_published_idx" ON "meta_content_calendar" USING btree ("published");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_createdBy_idx" ON "meta_content_calendar" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_createdAt_idx" ON "meta_content_calendar" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_activity_log_userId_idx" ON "meta_content_calendar_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_activity_log_calendarPostId_idx" ON "meta_content_calendar_activity_log" USING btree ("calendar_post_id");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_activity_log_action_idx" ON "meta_content_calendar_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_activity_log_createdAt_idx" ON "meta_content_calendar_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_media_calendarPostId_idx" ON "meta_content_calendar_media" USING btree ("calendar_post_id");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_media_mediaType_idx" ON "meta_content_calendar_media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "meta_content_calendar_media_order_idx" ON "meta_content_calendar_media" USING btree ("order");--> statement-breakpoint
CREATE INDEX "social_media_integration_platform_idx" ON "social_media_integration" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "social_media_integration_status_idx" ON "social_media_integration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "social_media_integration_userId_idx" ON "social_media_integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_media_integration_activity_log_userId_idx" ON "social_media_integration_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_media_integration_activity_log_integrationId_idx" ON "social_media_integration_activity_log" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "social_media_integration_activity_log_action_idx" ON "social_media_integration_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "social_media_integration_activity_log_createdAt_idx" ON "social_media_integration_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "social_media_page_token_integrationId_pageId_unique" ON "social_media_page_token" USING btree ("integration_id","page_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_integrationId_idx" ON "social_media_page_token" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_pageId_idx" ON "social_media_page_token" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_platform_idx" ON "social_media_page_token" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "social_media_page_token_teamId_idx" ON "social_media_page_token" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_isActive_idx" ON "social_media_page_token" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "social_media_page_token_accessTokenExpiresAt_idx" ON "social_media_page_token" USING btree ("access_token_expires_at");--> statement-breakpoint
CREATE INDEX "social_media_page_token_activity_log_userId_idx" ON "social_media_page_token_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_activity_log_pageTokenId_idx" ON "social_media_page_token_activity_log" USING btree ("page_token_id");--> statement-breakpoint
CREATE INDEX "social_media_page_token_activity_log_action_idx" ON "social_media_page_token_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "social_media_page_token_activity_log_createdAt_idx" ON "social_media_page_token_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meta_ads_account_integrationId_accountId_unique" ON "meta_ads_account" USING btree ("integration_id","account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_integrationId_idx" ON "meta_ads_account" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_accountId_idx" ON "meta_ads_account" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_teamId_idx" ON "meta_ads_account" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_status_idx" ON "meta_ads_account" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_ads_account_activity_userId_idx" ON "meta_ads_account_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_activity_accountId_idx" ON "meta_ads_account_activity_log" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_account_activity_action_idx" ON "meta_ads_account_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "meta_ads_account_activity_createdAt_idx" ON "meta_ads_account_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meta_ads_ad_adSetId_adId_unique" ON "meta_ads_ad" USING btree ("ad_set_id","ad_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_adSetId_idx" ON "meta_ads_ad" USING btree ("ad_set_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_campaignId_idx" ON "meta_ads_ad" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_accountId_idx" ON "meta_ads_ad" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_adId_idx" ON "meta_ads_ad" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_status_idx" ON "meta_ads_ad" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_activity_userId_idx" ON "meta_ads_ad_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_activity_adId_idx" ON "meta_ads_ad_activity_log" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_activity_action_idx" ON "meta_ads_ad_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_activity_createdAt_idx" ON "meta_ads_ad_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meta_ads_ad_set_campaignId_adSetId_unique" ON "meta_ads_ad_set" USING btree ("campaign_id","ad_set_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_campaignId_idx" ON "meta_ads_ad_set" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_accountId_idx" ON "meta_ads_ad_set" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_adSetId_idx" ON "meta_ads_ad_set" USING btree ("ad_set_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_status_idx" ON "meta_ads_ad_set" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_activity_userId_idx" ON "meta_ads_ad_set_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_activity_adSetId_idx" ON "meta_ads_ad_set_activity_log" USING btree ("ad_set_id");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_activity_action_idx" ON "meta_ads_ad_set_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "meta_ads_ad_set_activity_createdAt_idx" ON "meta_ads_ad_set_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meta_ads_campaign_accountId_campaignId_unique" ON "meta_ads_campaign" USING btree ("account_id","campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_accountId_idx" ON "meta_ads_campaign" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_campaignId_idx" ON "meta_ads_campaign" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_status_idx" ON "meta_ads_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_objective_idx" ON "meta_ads_campaign" USING btree ("objective");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_activity_userId_idx" ON "meta_ads_campaign_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_activity_campaignId_idx" ON "meta_ads_campaign_activity_log" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_activity_action_idx" ON "meta_ads_campaign_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_activity_createdAt_idx" ON "meta_ads_campaign_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_accountId_idx" ON "meta_ads_insight" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_campaignId_idx" ON "meta_ads_insight" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_adSetId_idx" ON "meta_ads_insight" USING btree ("ad_set_id");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_adId_idx" ON "meta_ads_insight" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_dateStart_idx" ON "meta_ads_insight" USING btree ("date_start");--> statement-breakpoint
CREATE INDEX "meta_ads_insight_dateEnd_idx" ON "meta_ads_insight" USING btree ("date_end");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_agencyRoleId_idx" ON "user" USING btree ("agency_role_id");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_lastAccessedTeamId_idx" ON "user" USING btree ("last_accessed_team_id");