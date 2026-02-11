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

import { useDocument } from './store';
import { EditorBlockWrapper } from './components';
import { ContainerEditor, ColumnsContainerEditor, EmailLayoutEditor } from './blocks';

// --- Context ---

const EditorBlockContext = createContext<string | null>(null);
export const useCurrentBlockId = () => {
    const context = useContext(EditorBlockContext);
    if (!context) throw new Error("useCurrentBlockId must be used within EditorBlockContext");
    return context;
};

// --- Dictionary ---

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
    Avatar: {
        schema: AvatarPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Avatar {...props} />
            </EditorBlockWrapper>
        ),
    },
    Button: {
        schema: ButtonPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Button {...props} />
            </EditorBlockWrapper>
        ),
    },
    Container: {
        schema: z.any(), // Simplified
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ContainerEditor {...props} />
            </EditorBlockWrapper>
        ),
    },
    ColumnsContainer: {
        schema: z.any(), // Simplified
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <ColumnsContainerEditor {...props} />
            </EditorBlockWrapper>
        ),
    },
    Heading: {
        schema: HeadingPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Heading {...props} />
            </EditorBlockWrapper>
        ),
    },
    Html: {
        schema: HtmlPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Html {...props} />
            </EditorBlockWrapper>
        ),
    },
    Image: {
        schema: ImagePropsSchema,
        Component: (data) => {
            const props = {
                ...data,
                props: {
                    ...data.props,
                    url: data.props?.url || 'https://placehold.co/600x400@2x/F8F8F8/CCC?text=Your%20image',
                },
            };
            return (
                <EditorBlockWrapper blockId={useCurrentBlockId()}>
                    <Image {...props} />
                </EditorBlockWrapper>
            );
        },
    },
    Text: {
        schema: TextPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Text {...props} />
            </EditorBlockWrapper>
        ),
    },
    EmailLayout: {
        schema: z.any(), // Simplified
        Component: (p) => <EmailLayoutEditor {...p} />,
    },
    Spacer: {
        schema: SpacerPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Spacer {...props} />
            </EditorBlockWrapper>
        ),
    },
    Divider: {
        schema: DividerPropsSchema,
        Component: (props) => (
            <EditorBlockWrapper blockId={useCurrentBlockId()}>
                <Divider {...props} />
            </EditorBlockWrapper>
        ),
    },
});

const CoreEditorBlock = buildBlockComponent(EDITOR_DICTIONARY);

export default function EditorBlock({ id }: { id: string }) {
    const document = useDocument();
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
