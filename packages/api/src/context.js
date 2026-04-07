import { auth } from "@npanel/auth";
export async function createContext({ context, createCaller, }) {
    const session = await auth.api.getSession({
        headers: context.req.raw.headers,
    });
    return {
        session: session,
        createCaller,
    };
}
