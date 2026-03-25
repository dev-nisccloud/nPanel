import { auth } from "@npanel/auth";
import { env } from "@npanel/env";

async function handle(request: Request) {
  return auth.handler(request);
}

export { handle as GET, handle as POST };
