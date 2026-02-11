import { z } from 'zod';

// EmailLayout types - EmailLayout doesn't have a separate block package
// Props are embedded in the email-builder document configuration
export const EmailLayoutPropsSchema = z.object({
    backdropColor: z.string().optional().nullable(),
    borderColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
    canvasColor: z.string().optional().nullable(),
    textColor: z.string().optional().nullable(),
    fontFamily: z.enum([
        'MODERN_SANS',
        'BOOK_SANS',
        'ORGANIC_SANS',
        'GEOMETRIC_SANS',
        'HEAVY_SANS',
        'ROUNDED_SANS',
        'MODERN_SERIF',
        'BOOK_SERIF',
        'MONOSPACE',
    ]).optional().nullable(),
    childrenIds: z.array(z.string()).optional().nullable(),
});

export type EmailLayoutProps = {
    props?: z.infer<typeof EmailLayoutPropsSchema>;
    style?: {
        borderRadius?: number | null;
    } | null;
};
