import React, { createContext, useContext } from 'react';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import { Button, ButtonPropsSchema } from '@usewaypoint/block-button';
import { Divider, DividerPropsSchema } from '@usewaypoint/block-divider';
import { Heading, HeadingPropsSchema } from '@usewaypoint/block-heading';
import { Html, HtmlPropsSchema } from '@usewaypoint/block-html';
import { Image, ImagePropsSchema } from '@usewaypoint/block-image';
import { Spacer, SpacerPropsSchema } from '@usewaypoint/block-spacer';
import { Text, TextPropsSchema } from '@usewaypoint/block-text';
import {
    buildBlockComponent,
    buildBlockConfigurationDictionary,
    buildBlockConfigurationSchema,
} from '@usewaypoint/document-core';

import { EditorBlockWrapper } from './components';
import { ContainerEditor, ColumnsContainerEditor, EmailLayoutEditor } from './blocks';
import {
    EditorBlockContext,
    RenderContext,
    DocumentContext,
    useCurrentBlockId,
    useEditorDocument
} from './context';

// ---------------------------------------------------------------------------
// Helper: resolve the image URL from native schema (data.props.url)
// or legacy flat schema (data.url) - used in Image block renderers only
// ---------------------------------------------------------------------------
function resolveImageUrl(data: any): string {
    return data?.props?.url ?? data?.url ?? '';
}

// ---------------------------------------------------------------------------
// Helper: resolve text content from native schema (data.props.text)
// or legacy flat schema (data.text)
// ---------------------------------------------------------------------------
function resolveText(data: any): string {
    return data?.props?.text ?? data?.text ?? '';
}

// ---------------------------------------------------------------------------
// EDITOR DICTIONARY
// ---------------------------------------------------------------------------

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
    Avatar: {
        schema: z.any(),
        // Avatar uses native { props, style } - pass through directly
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Avatar {...data} />
            </EditorBlockWrapper>
        ),
    },
    Button: {
        schema: z.any(),
        // Button uses native { props: { text, url, buttonBackgroundColor, buttonTextColor }, style }
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Button {...data} />
            </EditorBlockWrapper>
        ),
    },
    Container: {
        schema: z.any(),
        // Container: data = { props: { childrenIds }, style: { backgroundColor, padding, borderRadius } }
        // ContainerEditor destructures { style, props } - pass through without unwrapping
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ContainerEditor {...data} />
            </EditorBlockWrapper>
        ),
    },
    ColumnsContainer: {
        schema: z.any(),
        // ColumnsContainer: data = { props: { columns }, style: { padding } }
        // ColumnsContainerEditor destructures { style, props } - pass through
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ColumnsContainerEditor {...data} />
            </EditorBlockWrapper>
        ),
    },
    Heading: {
        schema: z.any(),
        // Heading uses native { props: { text, level }, style: { color, textAlign, fontWeight, padding } }
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Heading {...data} />
            </EditorBlockWrapper>
        ),
    },
    Html: {
        schema: z.any(),
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Html {...data} />
            </EditorBlockWrapper>
        ),
    },
    Image: {
        schema: z.any(),
        Component: (data: any) => {
            const url = resolveImageUrl(data);
            const isPlaceholder = url === '__IMAGE_PLACEHOLDER__';

            if (isPlaceholder) {
                return (
                    <EditorBlockWrapper blockId={useCurrentBlockId()}>
                        <div className="w-full aspect-[3/2] bg-gray-50 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full animate-shimmer" />
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="relative">
                                    <Sparkles className="size-8 text-blue-200 animate-pulse" />
                                    <div className="absolute -top-1 -right-1 size-3 bg-blue-500 rounded-full border-2 border-white animate-bounce" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                                        AI Generating
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-medium">
                                        Custom visual in progress...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </EditorBlockWrapper>
                );
            }

            // Native schema: { props: { url, alt, width, height }, style: { textAlign, padding } }
            return (
                <EditorBlockWrapper blockId={useCurrentBlockId()}>
                    <Image {...data} />
                </EditorBlockWrapper>
            );
        },
    },
    Text: {
        schema: TextPropsSchema,
        Component: (data: any) => {
            // Text uses native { props: { text }, style: { color, fontSize, textAlign, padding } }
            const text = resolveText(data);
            const style = data?.style ?? {};
            const hasHtml = /<[a-z][\s\S]*>/i.test(text || '');

            if (hasHtml) {
                return (
                    <EditorBlockWrapper blockId={useCurrentBlockId()}>
                        <div
                            style={{
                                color: style.color,
                                fontSize: style.fontSize,
                                fontWeight: style.fontWeight,
                                textAlign: style.textAlign,
                                lineHeight: '1.5',
                                paddingTop: style.padding?.top,
                                paddingRight: style.padding?.right,
                                paddingBottom: style.padding?.bottom,
                                paddingLeft: style.padding?.left,
                            }}
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    </EditorBlockWrapper>
                );
            }

            return (
                <EditorBlockWrapper blockId={useCurrentBlockId()}>
                    <Text {...data} />
                </EditorBlockWrapper>
            );
        },
    },
    EmailLayout: {
        schema: z.any(),
        Component: (p) => <EmailLayoutEditor {...p} />,
    },
    Spacer: {
        schema: z.any(),
        // Spacer uses native { props: { height } }
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Spacer {...data} />
            </EditorBlockWrapper>
        ),
    },
    Divider: {
        schema: z.any(),
        // Divider uses native { props: { lineHeight, lineColor }, style: { padding } }
        Component: (data) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Divider {...data} />
            </EditorBlockWrapper>
        ),
    },
});

// ---------------------------------------------------------------------------
// READ-ONLY DICTIONARY (Preview & HTML tabs)
// ---------------------------------------------------------------------------

const READ_ONLY_DICTIONARY = buildBlockConfigurationDictionary({
    Avatar: {
        schema: z.any(),
        Component: (data) => <Avatar {...data} />,
    },
    Button: {
        schema: z.any(),
        Component: (data) => <Button {...data} />,
    },
    Container: {
        schema: z.any(),
        Component: (data) => <ContainerEditor {...data} />,
    },
    ColumnsContainer: {
        schema: z.any(),
        Component: (data) => <ColumnsContainerEditor {...data} />,
    },
    Heading: {
        schema: z.any(),
        Component: (data) => <Heading {...data} />,
    },
    Html: {
        schema: z.any(),
        Component: (data) => <Html {...data} />,
    },
    Image: {
        schema: z.any(),
        Component: (data: any) => {
            const url = resolveImageUrl(data);
            const isPlaceholder = url === '__IMAGE_PLACEHOLDER__';

            if (isPlaceholder) {
                return (
                    <div className="w-full aspect-[3/2] bg-gray-50 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full animate-shimmer" />
                        <div className="flex flex-col items-center gap-2 relative z-10 text-blue-400">
                            <Sparkles className="size-6 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">AI Image Loading...</span>
                        </div>
                    </div>
                );
            }

            return <Image {...data} />;
        },
    },
    Text: {
        schema: TextPropsSchema,
        Component: (data: any) => {
            const text = resolveText(data);
            const style = data?.style ?? {};
            const hasHtml = /<[a-z][\s\S]*>/i.test(text || '');

            if (hasHtml) {
                return (
                    <div
                        style={{
                            color: style.color,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            textAlign: style.textAlign,
                            lineHeight: '1.5',
                            paddingTop: style.padding?.top,
                            paddingRight: style.padding?.right,
                            paddingBottom: style.padding?.bottom,
                            paddingLeft: style.padding?.left,
                        }}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                );
            }

            return <Text {...data} />;
        },
    },
    EmailLayout: {
        schema: z.any(),
        Component: (p) => <EmailLayoutEditor {...p} />,
    },
    Spacer: {
        schema: z.any(),
        Component: (data) => <Spacer {...data} />,
    },
    Divider: {
        schema: z.any(),
        Component: (data) => <Divider {...data} />,
    },
});

// ---------------------------------------------------------------------------
// Exported components
// ---------------------------------------------------------------------------

const CoreEditorBlock = buildBlockComponent(EDITOR_DICTIONARY);
const CoreReadOnlyBlock = buildBlockComponent(READ_ONLY_DICTIONARY);

export default function EditorBlock({ id }: { id: string }) {
    const document = useEditorDocument();
    const block = document[id];
    if (!block) {
        return <div className="text-red-500 text-xs p-1">Block not found: {id}</div>;
    }
    return (
        <EditorBlockContext.Provider value={id}>
            <CoreEditorBlock {...block} />
        </EditorBlockContext.Provider>
    );
}

export function StandardReader({
    document,
    rootBlockId,
    useRawValue = false,
}: {
    document: any;
    rootBlockId: string;
    useRawValue?: boolean;
}) {
    const block = document[rootBlockId];
    if (!block) return null;

    return (
        <DocumentContext.Provider value={document}>
            <RenderContext.Provider value={{ useRawValue }}>
                <EditorBlockContext.Provider value={rootBlockId}>
                    <CoreReadOnlyBlock {...block} />
                </EditorBlockContext.Provider>
            </RenderContext.Provider>
        </DocumentContext.Provider>
    );
}
