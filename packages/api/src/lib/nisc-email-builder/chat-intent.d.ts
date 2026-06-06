export type NebChatIntent = "edit" | "full_revamp";
/** Default: edit existing HTML. Full revamp only when the user clearly asks for it. */
export declare function classifyChatIntent(message: string): NebChatIntent;
