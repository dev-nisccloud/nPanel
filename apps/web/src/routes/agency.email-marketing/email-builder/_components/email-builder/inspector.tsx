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
import { type ButtonProps, ButtonPropsSchema } from '@usewaypoint/block-button';
import { type ImageProps, ImagePropsSchema } from '@usewaypoint/block-image';
import { type AvatarProps, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import { type TextProps, TextPropsSchema } from '@usewaypoint/block-text';
import { type HeadingProps, HeadingPropsSchema } from '@usewaypoint/block-heading';
import { type DividerProps, DividerPropsSchema } from '@usewaypoint/block-divider';
import { type SpacerProps, SpacerPropsSchema } from '@usewaypoint/block-spacer';
import { type HtmlProps, HtmlPropsSchema } from '@usewaypoint/block-html';
import { type ContainerProps, ContainerPropsSchema } from '@usewaypoint/block-container';
import { type ColumnsContainerProps, ColumnsContainerPropsSchema } from '@usewaypoint/block-columns-container';
import { type EmailLayoutProps, EmailLayoutPropsSchema } from './helpers/EmailLayoutTypes';

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
                        key={selectedBlockId}
                        data={data as ButtonProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Image':
                return (
                    <ImageSidebarPanel
                        key={selectedBlockId}
                        data={data as ImageProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Avatar':
                return (
                    <AvatarSidebarPanel
                        key={selectedBlockId}
                        data={data as AvatarProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Text':
                return (
                    <TextSidebarPanel
                        key={selectedBlockId}
                        data={data as TextProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Heading':
                return (
                    <HeadingSidebarPanel
                        key={selectedBlockId}
                        data={data as HeadingProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Divider':
                return (
                    <DividerSidebarPanel
                        key={selectedBlockId}
                        data={data as DividerProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Spacer':
                return (
                    <SpacerSidebarPanel
                        key={selectedBlockId}
                        data={data as SpacerProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Html':
                return (
                    <HtmlSidebarPanel
                        key={selectedBlockId}
                        data={data as HtmlProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'Container':
                return (
                    <ContainerSidebarPanel
                        key={selectedBlockId}
                        data={data as ContainerProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'ColumnsContainer':
                return (
                    <ColumnsContainerSidebarPanel
                        key={selectedBlockId}
                        data={data as ColumnsContainerProps}
                        setData={(v) => setData(v)}
                    />
                );
            case 'EmailLayout':
                return (
                    <EmailLayoutSidebarPanel
                        key={selectedBlockId}
                        data={data as EmailLayoutProps}
                        setData={(v) => setData(v)}
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
