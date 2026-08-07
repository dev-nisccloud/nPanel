export type MirrorExternalImageOptions = {
    refererHint?: string | null;
    filenamePrefix?: string;
};
/**
 * Re-host an external image on object storage so Replicate (and email clients) can fetch it.
 */
export declare function mirrorExternalImageUrl(sourceUrl: string, options?: MirrorExternalImageOptions): Promise<string>;
