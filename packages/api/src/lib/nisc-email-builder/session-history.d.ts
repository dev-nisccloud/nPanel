/** Build a text block describing prior work for chat/revision agents. */
export declare function buildNebSessionHistoryContext(params: {
    designId: string;
    sessionId: string;
}): Promise<string>;
