import { z } from "zod";
import { asPleskArray, firstPleskResult, normalizePleskPacket } from "./plesk-xml-normalize";

// Schema for the raw Plesk API response for single subscription (getById)
export const pleskSubscriptionByIdResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.preprocess(
      normalizePleskPacket,
      z.object({
      webspace: z.object({
        get: z.object({
          result: z.preprocess(
            firstPleskResult,
            z.object({
            status: z.string().optional(),
            "filter-id": z.coerce.number().optional(),
            id: z.coerce.number(),
            data: z.object({
              gen_info: z.object({
                "cr_date": z.string().optional(),
                name: z.string().optional(),
                "ascii-name": z.string().optional(),
                status: z.coerce.number().optional(),
                "real_size": z.coerce.number().optional(),
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
                  property: z.preprocess(asPleskArray, z.array(z.object({
                    name: z.string().optional(),
                    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
                  }))).optional(),
                  ip_address: z.string().optional(),
                }).optional(),
              }).optional(),
              limits: z.object({
                overuse: z.string().optional(),
                limit: z.preprocess(asPleskArray, z.array(z.object({
                  name: z.string().optional(),
                  // XML parser may leave numeric tag values as strings
                  value: z.coerce.number().optional(),
                }))).optional(),
              }).optional(),
              stat: z.object({
                traffic: z.coerce.number().optional(),
                subdom: z.coerce.number().optional(),
                wu: z.coerce.number().optional(),
                box: z.coerce.number().optional(),
                redir: z.coerce.number().optional(),
                mg: z.coerce.number().optional(),
                resp: z.coerce.number().optional(),
                maillists: z.coerce.number().optional(),
                db: z.coerce.number().optional(),
                mssql_db: z.coerce.number().optional(),
                traffic_prevday: z.coerce.number().optional(),
                domains: z.coerce.number().optional(),
                sites: z.coerce.number().optional(),
              }).optional(),
              prefs: z.object({
                www: z.boolean().optional(),
                stat_ttl: z.number().optional(),
              }).optional(),
              permissions: z.object({
                permission: z.preprocess(asPleskArray, z.array(z.object({
                  name: z.string().optional(),
                  value: z.boolean().optional(),
                }))).optional(),
              }).optional(),
            }).optional(),
            }),
          ),
        }),
      }).optional(),
      system: z.object({
        status: z.string().optional(),
        errcode: z.union([z.string(), z.number()]).optional(),
        errtext: z.string().optional(),
      }).optional(),
    }),
    ),
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
      value: z.coerce.number().optional(),
    })).optional(),
  }).optional(),
  stat: z.object({
    traffic: z.coerce.number().optional(),
    subdom: z.coerce.number().optional(),
    wu: z.coerce.number().optional(),
    box: z.coerce.number().optional(),
    redir: z.coerce.number().optional(),
    mg: z.coerce.number().optional(),
    resp: z.coerce.number().optional(),
    maillists: z.coerce.number().optional(),
    db: z.coerce.number().optional(),
    mssql_db: z.coerce.number().optional(),
    traffic_prevday: z.coerce.number().optional(),
    domains: z.coerce.number().optional(),
    sites: z.coerce.number().optional(),
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
