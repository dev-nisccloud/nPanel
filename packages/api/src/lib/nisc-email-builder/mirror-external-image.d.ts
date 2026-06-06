/**
 * Re-host an external image on UploadThing so Replicate (and email clients) can fetch it.
 * Tries direct fetch with site referer first, then UploadThing URL ingest, then wsrv.nl proxy.
 */
export declare function mirrorExternalImageUrl(sourceUrl: string, options?: {
    refererHint?: string | null;
    filenamePrefix?: string;
}): Promise<string>;
