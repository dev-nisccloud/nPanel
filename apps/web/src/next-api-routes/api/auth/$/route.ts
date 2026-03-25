import { auth } from "@npanel/auth";

async function handle(request: Request) {
  return auth.handler(request);
}

export { handle as GET, handle as POST };
