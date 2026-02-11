import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocument, useSelectedBlockId, useSelectedSidebarTab, setSidebarTab, setDocument } from './store';
import EmailLayoutSidebarPanel from './input-panels/EmailLayoutSidebarPanel';
import ButtonSidebarPanel from './input-panels/ButtonSidebarPanel';
import ImageSidebarPanel from './input-panels/ImageSidebarPanel';
import AvatarSidebarPanel from './input-panels/AvatarSidebarPanel';
import TextSidebarPanel from './input-panels/TextSidebarPanel';
import HeadingSidebarPanel from './input-panels/HeadingSidebarPanel';
import DividerSidebarPanel from './input-panels/DividerSidebarPanel';
import SpacerSidebarPanel from './input-panels/SpacerSidebarPanel';
import HtmlSidebarPanel from './input-panels/HtmlSidebarPanel';
import ContainerSidebarPanel from './input-panels/ContainerSidebarPanel';
import ColumnsContainerSidebarPanel from './input-panels/ColumnsContainerSidebarPanel';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ButtonProps, ButtonPropsSchema } from '@usewaypoint/block-button';
import { ImageProps, ImagePropsSchema } from '@usewaypoint/block-image';
import { AvatarProps, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';
import { HeadingProps, HeadingPropsSchema } from '@usewaypoint/block-heading';
import { DividerProps, DividerPropsSchema } from '@usewaypoint/block-divider';
import { SpacerProps, SpacerPropsSchema } from '@usewaypoint/block-spacer';
import { HtmlProps, HtmlPropsSchema } from '@usewaypoint/block-html';
import { ContainerProps, ContainerPropsSchema } from '@usewaypoint/block-container';
import { ColumnsContainerProps, ColumnsContainerPropsSchema } from '@usewaypoint/block-columns-container';
import { EmailLayoutProps, EmailLayoutPropsSchema } from './helpers/EmailLayoutTypes';

export function InspectorDrawer() {
    const document = useDocument();
    const selectedBlockId = useSelectedBlockId();
    const selectedSidebarTab = useSelectedSidebarTab();

    const selectedBlock = selectedBlockId ? document[selectedBlockId] : null;

    const renderConfigurationPanel = () => {
        if (!selectedBlock) {
            return (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
                    Select a block to configure its properties
                </div>
            );
        }

        const { type, data } = selectedBlock;
        const setData = (data: any) => {
            setDocument({
                [selectedBlockId!]: {
                    ...selectedBlock,
                    data,
                },
            });
        };

        switch (type) {
            case 'Button':
                return (
                    <ButtonSidebarPanel
                        data={data as ButtonProps}
                        setData={(v) => {
                            const res = ButtonPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Image':
                return (
                    <ImageSidebarPanel
                        data={data as ImageProps}
                        setData={(v) => {
                            const res = ImagePropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Avatar':
                return (
                    <AvatarSidebarPanel
                        data={data as AvatarProps}
                        setData={(v) => {
                            const res = AvatarPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Text':
                return (
                    <TextSidebarPanel
                        data={data as TextProps}
                        setData={(v) => {
                            const res = TextPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Heading':
                return (
                    <HeadingSidebarPanel
                        data={data as HeadingProps}
                        setData={(v) => {
                            const res = HeadingPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Divider':
                return (
                    <DividerSidebarPanel
                        data={data as DividerProps}
                        setData={(v) => {
                            const res = DividerPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Spacer':
                return (
                    <SpacerSidebarPanel
                        data={data as SpacerProps}
                        setData={(v) => {
                            const res = SpacerPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Html':
                return (
                    <HtmlSidebarPanel
                        data={data as HtmlProps}
                        setData={(v) => {
                            const res = HtmlPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'Container':
                return (
                    <ContainerSidebarPanel
                        data={data as ContainerProps}
                        setData={(v) => {
                            const res = ContainerPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'ColumnsContainer':
                return (
                    <ColumnsContainerSidebarPanel
                        data={data as ColumnsContainerProps}
                        setData={(v) => {
                            const res = ColumnsContainerPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            case 'EmailLayout':
                return (
                    <EmailLayoutSidebarPanel
                        data={data as EmailLayoutProps}
                        setData={(v) => {
                            const res = EmailLayoutPropsSchema.safeParse(v);
                            if (res.success) setData(res.data);
                        }}
                    />
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
                        No configuration available for this block type
                    </div>
                );
        }
    };

    const renderStylesPanel = () => {
        // document.root is the EmailLayout block itself, not an array
        if (!document.root || document.root.type !== 'EmailLayout') {
            return (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
                    Email layout not found
                </div>
            );
        }

        const setData = (data: EmailLayoutProps) => {
            setDocument({
                ...document,
                root: {
                    ...document.root,
                    data: {
                        ...document.root.data,
                        ...data.props,
                    },
                    ...(data.style && { style: data.style }),
                },
            });
        };

        return (
            <EmailLayoutSidebarPanel
                data={{ props: document.root.data, style: document.root.style }}
                setData={setData}
            />
        );
    };

    return (
        <div className="h-full flex flex-col bg-background border-l w-[400px] shrink-0">
            <div className="shrink-0 border-b">
                <Tabs
                    value={selectedSidebarTab}
                    onValueChange={(value) => setSidebarTab(value as 'styles' | 'block-configuration')}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 rounded-none bg-transparent p-0">
                        <TabsTrigger
                            value="styles"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            Styles
                        </TabsTrigger>
                        <TabsTrigger
                            value="block-configuration"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            Inspect
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                    {selectedSidebarTab === 'styles' ? renderStylesPanel() : renderConfigurationPanel()}
                    <ScrollBar orientation="vertical" forceMount />
                </ScrollArea>
            </div>
        </div>
    );
}
