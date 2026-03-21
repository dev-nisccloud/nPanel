import { z } from "zod";

// ============================================================================
// INDEPENDENT FRONTEND SCHEMAS - Not importing from API
// ============================================================================

// Integration Status Schema
export const integrationStatusSchema = z.enum([
	"ACTIVE",
	"INACTIVE",
	"EXPIRED",
	"REVOKED",
	"PENDING",
]);

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

// Stored Credentials Schema
export const storedCredentialsSchema = z.object({
	integrationId: z.string(),
	hasAccessToken: z.boolean(),
	accessTokenExpiresAt: z.string().nullable(),
	isExpired: z.boolean(),
	scope: z.string().nullable(),
	status: z.string(),
	userId: z.string(),
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

// Facebook Page Schema
export const facebookPageSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	category: z.string().optional(),
	access_token: z.string().optional(),
	picture: z
		.object({
			data: z
				.object({
					url: z.string().optional(),
					width: z.number().optional(),
					height: z.number().optional(),
				})
				.optional(),
		})
		.optional(),
	cover: z
		.object({
			source: z.string().optional(),
		})
		.optional(),
	about: z.string().optional(),
	description: z.string().optional(),
	website: z.string().optional(),
	phone: z.string().optional(),
	emails: z.array(z.string()).optional(),
	location: z
		.object({
			city: z.string().optional(),
			country: z.string().optional(),
			latitude: z.number().optional(),
			longitude: z.number().optional(),
			state: z.string().optional(),
			street: z.string().optional(),
			zip: z.string().optional(),
		})
		.optional(),
	fan_count: z.number().optional(),
	followers_count: z.number().optional(),
	link: z.string().optional(),
	verification_status: z.string().optional(),
});

export type FacebookPage = z.infer<typeof facebookPageSchema>;

// Pages List Response Schema
export const pagesListResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(facebookPageSchema),
	meta: z.object({
		retrieved_at: z.string(),
		total_pages: z.number(),
	}),
});

export type PagesListResponse = z.infer<typeof pagesListResponseSchema>;

// Page Content Schema (for posts, photos, videos, events)
export const pageContentItemSchema = z.object({
	id: z.string(),
	message: z.string().optional(),
	story: z.string().optional(),
	created_time: z.string().optional(),
	updated_time: z.string().optional(),
	permalink_url: z.string().optional(),
	type: z.string().optional(),
	status_type: z.string().optional(),
	// Image/media fields
	picture: z.string().optional(), // Post/photo/video thumbnail
	full_picture: z.string().optional(), // Full size picture from post attachment (PagePost field)
	images: z
		.array(
			z.object({
				height: z.number().optional(),
				width: z.number().optional(),
				source: z.string().optional(),
			})
		)
		.optional(), // Photo images array (for photos endpoint)
	source: z.string().optional(), // Video source URL
	link: z.string().optional(), // Photo/video link
	// Engagement metrics (fetched separately)
	likes: z
		.object({
			data: z.array(z.any()).optional(),
			summary: z
				.object({
					total_count: z.number().optional(),
				})
				.optional(),
		})
		.optional(),
	comments: z
		.object({
			data: z.array(z.any()).optional(),
			summary: z
				.object({
					total_count: z.number().optional(),
				})
				.optional(),
		})
		.optional(),
	shares: z
		.object({
			count: z.number().optional(),
		})
		.optional(),
	attachments: z
		.object({
			data: z
				.array(
					z.object({
						media: z
							.object({
								image: z
									.object({
										height: z.number().optional(),
										width: z.number().optional(),
										src: z.string().optional(),
									})
									.optional(),
								source: z.string().optional(), // For videos
							})
							.optional(),
						media_type: z.string().optional(), // 'photo', 'video', 'link', etc.
						type: z.string().optional(), // 'photo', 'video', 'album', etc.
						url: z.string().optional(),
						title: z.string().optional(),
						description: z.string().optional(),
						subattachments: z
							.object({
								data: z
									.array(
										z.object({
											media: z
												.object({
													image: z
														.object({
															height: z.number().optional(),
															width: z.number().optional(),
															src: z.string().optional(),
														})
														.optional(),
													source: z.string().optional(),
												})
												.optional(),
											media_type: z.string().optional(),
											type: z.string().optional(),
											url: z.string().optional(),
											title: z.string().optional(),
										})
									)
									.optional(),
							})
							.optional(), // For multiple attachments (albums, carousels)
					})
				)
				.optional(),
		})
		.optional(),
	from: z
		.object({
			id: z.string().optional(),
			name: z.string().optional(),
		})
		.optional(),
	// Additional fields for photos/videos/events
	name: z.string().optional(), // Photo/video/event name
	description: z.string().optional(), // Video/event description
	length: z.number().optional(), // Video length in seconds
	start_time: z.string().optional(), // Event start time
	end_time: z.string().optional(), // Event end time
	place: z
		.object({
			id: z.string().optional(),
			name: z.string().optional(),
			location: z
				.object({
					city: z.string().optional(),
					country: z.string().optional(),
					latitude: z.number().optional(),
					longitude: z.number().optional(),
				})
				.optional(),
		})
		.optional(),
	attending_count: z.number().optional(),
	declined_count: z.number().optional(),
	interested_count: z.number().optional(),
});

export type PageContentItem = z.infer<typeof pageContentItemSchema>;

// Page Content Response Schema
export const pageContentResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(pageContentItemSchema),
	pagination: z.object({
		previous: z.string().nullable(),
		next: z.string().nullable(),
		cursors: z
			.object({
				before: z.string().optional(),
				after: z.string().optional(),
			})
			.nullable(),
	}),
	meta: z.object({
		retrieved_at: z.string(),
		page_id: z.string(),
		content_type: z.string(),
		total_items: z.number(),
	}),
});

export type PageContentResponse = z.infer<typeof pageContentResponseSchema>;

// Content Type Schema
export const contentTypeSchema = z.enum(["posts", "photos", "videos", "events"]);

export type ContentType = z.infer<typeof contentTypeSchema>;


