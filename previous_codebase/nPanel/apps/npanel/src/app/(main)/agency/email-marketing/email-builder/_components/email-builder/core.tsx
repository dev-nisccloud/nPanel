import React, { createContext, useContext } from 'react';
import { z } from 'zod';
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
import { getFontFamily } from './helpers/fontFamily';

import { EditorBlockWrapper } from './components';
import { ContainerEditor, ColumnsContainerEditor, EmailLayoutEditor } from './blocks';
import {
    EditorBlockContext,
    RenderContext,
    DocumentContext,
    useCurrentBlockId,
    useEditorDocument
} from './context';

// --- Helpers ---

function useResolveBlockStyle(data: any) {
    const resolved = { ...data };

    if (data?.style?.fontFamily) {
        resolved.style = {
            ...data.style,
            fontFamily: getFontFamily(data.style.fontFamily),
        };
    }

    if (data?.props?.fontFamily) {
        resolved.props = {
            ...data.props,
            fontFamily: getFontFamily(data.props.fontFamily),
        };
    }

    return resolved;
}

// --- Dictionary ---

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
    Avatar: {
        schema: AvatarPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Avatar {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Button: {
        schema: ButtonPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Button {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Container: {
        schema: z.object({}).passthrough(), // Simplified
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ContainerEditor {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    ColumnsContainer: {
        schema: z.object({}).passthrough(), // Simplified
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ColumnsContainerEditor {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Heading: {
        schema: HeadingPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Heading {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Html: {
        schema: HtmlPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Html {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Image: {
        schema: ImagePropsSchema,
        Component: (data) => {
            const resolved = useResolveBlockStyle({
                ...data,
                props: {
                    ...data.props,
                    url: data.props?.url || 'https://placehold.co/600x400@2x/F8F8F8/CCC?text=Your%20image',
                },
            });
            return (
                <EditorBlockWrapper blockId={useCurrentBlockId()}>
                    <Image {...resolved} />
                </EditorBlockWrapper>
            );
        },
    },
    Text: {
        schema: TextPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Text {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    EmailLayout: {
        schema: z.object({}).passthrough(), // Simplified
        Component: (p) => <EmailLayoutEditor {...p} />,
    },
    Spacer: {
        schema: SpacerPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Spacer {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
    Divider: {
        schema: DividerPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Divider {...useResolveBlockStyle(props)} />
            </EditorBlockWrapper>
        ),
    },
});

const READ_ONLY_DICTIONARY = buildBlockConfigurationDictionary({
    Avatar: {
        schema: AvatarPropsSchema,
        Component: (props) => <Avatar {...useResolveBlockStyle(props)} />,
    },
    Button: {
        schema: ButtonPropsSchema,
        Component: (props) => <Button {...useResolveBlockStyle(props)} />,
    },
    Container: {
        schema: z.object({}).passthrough(),
        Component: (props) => <ContainerEditor {...useResolveBlockStyle(props)} />,
    },
    ColumnsContainer: {
        schema: z.object({}).passthrough(),
        Component: (props) => <ColumnsContainerEditor {...useResolveBlockStyle(props)} />,
    },
    Heading: {
        schema: HeadingPropsSchema,
        Component: (props) => <Heading {...useResolveBlockStyle(props)} />,
    },
    Html: {
        schema: HtmlPropsSchema,
        Component: (props) => <Html {...useResolveBlockStyle(props)} />,
    },
    Image: {
        schema: ImagePropsSchema,
        Component: (data) => {
            const resolved = useResolveBlockStyle({
                ...data,
                props: {
                    ...data.props,
                    url: data.props?.url || 'https://placehold.co/600x400@2x/F8F8F8/CCC?text=Your%20image',
                },
            });
            return <Image {...resolved} />;
        },
    },
    Text: {
        schema: TextPropsSchema,
        Component: (props) => <Text {...useResolveBlockStyle(props)} />,
    },
    EmailLayout: {
        schema: z.object({}).passthrough(),
        Component: (p) => <EmailLayoutEditor {...p} />,
    },
    Spacer: {
        schema: SpacerPropsSchema,
        Component: (props) => <Spacer {...useResolveBlockStyle(props)} />,
    },
    Divider: {
        schema: DividerPropsSchema,
        Component: (props) => <Divider {...useResolveBlockStyle(props)} />,
    },
});

const CoreEditorBlock = buildBlockComponent(EDITOR_DICTIONARY);
const CoreReadOnlyBlock = buildBlockComponent(READ_ONLY_DICTIONARY);

export default function EditorBlock({ id }: { id: string }) {
    const document = useEditorDocument();
    const block = document[id];
    if (!block) {
        return <div className="text-red-500">Block not found: {id}</div>;
    }
    return (
        <EditorBlockContext.Provider value={id}>
            <CoreEditorBlock {...block} />
        </EditorBlockContext.Provider>
    );
}

export function StandardReader({ document, rootBlockId, useRawValue = false }: { document: any; rootBlockId: string; useRawValue?: boolean }) {
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
