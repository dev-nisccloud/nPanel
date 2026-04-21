import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';

type DeleteInput = {
  id: number;
};

function buildSubscriptionDeleteXml(data: DeleteInput): string {
  if (!data.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subscription ID is required' });
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <del>
      <filter>
        <id>${data.id}</id>
      </filter>
    </del>
  </webspace>
</packet>`;
}

export const subscriptionsDeleteRouter = router({
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        if (!process.env.PLESK_XML_ENDPOINT) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'PLESK_XML_ENDPOINT not set' });
        const xmlRequest = buildSubscriptionDeleteXml(input as DeleteInput);
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
        if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
        if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
        if (!xml || xml.trim() === '') throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server' });
        return { raw: xml };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete subscription', cause: error });
      }
    }),
});
