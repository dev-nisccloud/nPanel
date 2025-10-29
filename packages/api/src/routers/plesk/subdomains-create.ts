import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

type CreateInput = {
	parent: string;
	name: string;
	wwwRoot?: string;
	ssh?: boolean;
	safeMode?: boolean;
	php?: string;
	cgi?: boolean;
	perl?: boolean;
	python?: boolean;
	ruby?: boolean;
	nodejs?: boolean;
	webstat?: 'none' | 'awstats' | 'webalizer' | 'analog' | 'custom';
	hosting?: { ipAddress?: string; ftpLogin?: string; ftpPassword?: string };
};

function validateCreateData(data: CreateInput): void {
  if (!data.parent) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Parent domain is required' });
  if (!data.name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subdomain name is required' });
  if (!data.parent.includes('.')) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Parent domain must be a valid domain name' });
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(data.name)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid subdomain name format' });
  if (data.webstat && !['none', 'awstats', 'webalizer', 'analog', 'custom'].includes(data.webstat)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid webstat type' });
}

function buildSubdomainCreateXml(data: CreateInput): string {
  const escapeXml = (str: string): string => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

  const subdomainElements: string[] = [
    `        <parent>${escapeXml(data.parent)}</parent>`,
    `        <name>${escapeXml(data.name)}</name>`
  ];

  const properties: string[] = [];
  if (data.wwwRoot) properties.push(`            <property><name>www_root</name><value>${escapeXml(data.wwwRoot)}</value></property>`);
  if (data.ssh !== undefined) properties.push(`            <property><name>ssh</name><value>${data.ssh ? 'true' : 'false'}</value></property>`);
  if (data.safeMode !== undefined) properties.push(`            <property><name>safe_mode</name><value>${data.safeMode ? 'true' : 'false'}</value></property>`);
  if (data.php) properties.push(`            <property><name>php</name><value>${escapeXml(data.php)}</value></property>`);
  if (data.cgi !== undefined) properties.push(`            <property><name>cgi</name><value>${data.cgi ? 'true' : 'false'}</value></property>`);
  if (data.perl !== undefined) properties.push(`            <property><name>perl</name><value>${data.perl ? 'true' : 'false'}</value></property>`);
  if (data.python !== undefined) properties.push(`            <property><name>python</name><value>${data.python ? 'true' : 'false'}</value></property>`);
  if (data.ruby !== undefined) properties.push(`            <property><name>ruby</name><value>${data.ruby ? 'true' : 'false'}</value></property>`);
  if (data.nodejs !== undefined) properties.push(`            <property><name>nodejs</name><value>${data.nodejs ? 'true' : 'false'}</value></property>`);
  if (data.webstat) properties.push(`            <property><name>webstat</name><value>${escapeXml(data.webstat)}</value></property>`);

  const propertiesXml = properties.length > 0
    ? `          <properties>
${properties.join('\n')}
          </properties>`
    : '';

  const hostingXml = data.hosting
    ? `      <hosting>
        <vrt_hst>
          <property><name>ip_address</name><value>${escapeXml(data.hosting.ipAddress ?? '')}</value></property>
          <property><name>ftp_login</name><value>${escapeXml(data.hosting.ftpLogin ?? '')}</value></property>
          <property><name>ftp_password</name><value>${escapeXml(data.hosting.ftpPassword ?? '')}</value></property>
        </vrt_hst>
      </hosting>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <subdomain>
    <add>
      <parent>
${subdomainElements.join('\n')}
      </parent>
${propertiesXml}
${hostingXml}
    </add>
  </subdomain>
</packet>`;
}

export const subdomainsCreateRouter = router({
  create: publicProcedure
    .input(z.object({
      parent: z.string(),
      name: z.string(),
      wwwRoot: z.string().optional(),
      ssh: z.boolean().optional(),
      safeMode: z.boolean().optional(),
      php: z.string().optional(),
      cgi: z.boolean().optional(),
      perl: z.boolean().optional(),
      python: z.boolean().optional(),
      ruby: z.boolean().optional(),
      nodejs: z.boolean().optional(),
      webstat: z.enum(['none', 'awstats', 'webalizer', 'analog', 'custom']).optional(),
      hosting: z.object({
        ipAddress: z.string().optional(),
        ftpLogin: z.string().optional(),
        ftpPassword: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        if (!process.env.PLESK_XML_ENDPOINT) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'PLESK_XML_ENDPOINT not set' });
        validateCreateData(input as CreateInput);
        const xmlRequest = buildSubdomainCreateXml(input as CreateInput);
  const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
        if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
        if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
        if (!xml || xml.trim() === '') throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server' });
        return { raw: xml };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create subdomain', cause: error });
      }
    }),
});
