import { z } from "zod";

// Schema for the raw Plesk API response for single subscription (getById)
export const pleskSubscriptionByIdResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.object({
      webspace: z.object({
        get: z.object({
          result: z.object({
            status: z.string(),
            "filter-id": z.number(),
            id: z.number(),
            data: z.object({
              gen_info: z.object({
                "cr_date": z.string().optional(),
                name: z.string().optional(),
                "ascii-name": z.string().optional(),
                status: z.number().optional(),
                "real_size": z.number().optional(),
                "owner-login": z.string().optional(),
                "dns_ip_address": z.string().optional(),
                htype: z.string().optional(),
                guid: z.string().optional(),
                "vendor-guid": z.string().optional(),
                "external-id": z.string().optional(),
                "sb-site-uuid": z.string().optional(),
                description: z.string().optional(),
                "admin-description": z.string().optional(),
              }),
              hosting: z.object({
                vrt_hst: z.object({
                  property: z.array(z.object({
                    name: z.string().optional(),
                    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
                  })).optional(),
                  ip_address: z.string().optional(),
                }).optional(),
              }).optional(),
              limits: z.object({
                overuse: z.string().optional(),
                limit: z.array(z.object({
                  name: z.string().optional(),
                  value: z.number().optional(),
                })).optional(),
              }).optional(),
              stat: z.object({
                traffic: z.number().optional(),
                subdom: z.number().optional(),
                wu: z.number().optional(),
                box: z.number().optional(),
                redir: z.number().optional(),
                mg: z.number().optional(),
                resp: z.number().optional(),
                maillists: z.number().optional(),
                db: z.number().optional(),
                mssql_db: z.number().optional(),
                traffic_prevday: z.number().optional(),
                domains: z.number().optional(),
                sites: z.number().optional(),
              }).optional(),
              prefs: z.object({
                www: z.boolean().optional(),
                stat_ttl: z.number().optional(),
              }).optional(),
              permissions: z.object({
                permission: z.array(z.object({
                  name: z.string().optional(),
                  value: z.boolean().optional(),
                })).optional(),
              }).optional(),
            }),
          }),
        }),
      }).optional(),
      system: z.object({
        status: z.string().optional(),
        errcode: z.union([z.string(), z.number()]).optional(),
        errtext: z.string().optional(),
      }).optional(),
    }),
  }),
});

// Schema for the transformed data used in the detail page
export const hostingDetailSchema = z.object({
  id: z.number(),
  gen_info: z.object({
    "cr_date": z.string().optional(),
    name: z.string().optional(),
    "ascii-name": z.string().optional(),
    status: z.number().optional(),
    "real_size": z.number().optional(),
    "owner-login": z.string().optional(),
    "dns_ip_address": z.string().optional(),
    htype: z.string().optional(),
    guid: z.string().optional(),
    "vendor-guid": z.string().optional(),
    "external-id": z.string().optional(),
    "sb-site-uuid": z.string().optional(),
    description: z.string().optional(),
    "admin-description": z.string().optional(),
  }),
  hosting: z.object({
    vrt_hst: z.object({
      property: z.array(z.object({
        name: z.string().optional(),
        value: z.union([z.string(), z.number(), z.boolean()]).optional(),
      })).optional(),
      ip_address: z.string().optional(),
    }).optional(),
  }).optional(),
  limits: z.object({
    overuse: z.string().optional(),
    limit: z.array(z.object({
      name: z.string().optional(),
      value: z.number().optional(),
    })).optional(),
  }).optional(),
  stat: z.object({
    traffic: z.number().optional(),
    subdom: z.number().optional(),
    wu: z.number().optional(),
    box: z.number().optional(),
    redir: z.number().optional(),
    mg: z.number().optional(),
    resp: z.number().optional(),
    maillists: z.number().optional(),
    db: z.number().optional(),
    mssql_db: z.number().optional(),
    traffic_prevday: z.number().optional(),
    domains: z.number().optional(),
    sites: z.number().optional(),
  }).optional(),
  prefs: z.object({
    www: z.boolean().optional(),
    stat_ttl: z.number().optional(),
  }).optional(),
  permissions: z.object({
    permission: z.array(z.object({
      name: z.string().optional(),
      value: z.boolean().optional(),
    })).optional(),
  }).optional(),
});

export type PleskSubscriptionByIdResponse = z.infer<typeof pleskSubscriptionByIdResponseSchema>;
export type HostingDetail = z.infer<typeof hostingDetailSchema>;
