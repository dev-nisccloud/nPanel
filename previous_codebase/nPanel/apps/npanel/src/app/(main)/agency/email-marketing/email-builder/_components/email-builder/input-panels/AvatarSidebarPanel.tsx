import React, { useState } from 'react';
import { ZodError } from 'zod';
import { Maximize2 } from 'lucide-react';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import { AvatarProps, AvatarPropsDefaults, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import RadioGroupInput from '../helpers/inputs/RadioGroupInput';
import SliderInput from '../helpers/inputs/SliderInput';
import TextInput from '../helpers/inputs/TextInput';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';

type AvatarSidebarPanelProps = {
    data: AvatarProps;
    setData: (v: AvatarProps) => void;
};

export default function AvatarSidebarPanel({ data, setData }: AvatarSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    const size = data.props?.size ?? AvatarPropsDefaults.size;
    const imageUrl = data.props?.imageUrl ?? AvatarPropsDefaults.imageUrl;
    const alt = data.props?.alt ?? AvatarPropsDefaults.alt;
    const shape = data.props?.shape ?? AvatarPropsDefaults.shape;

    return (
        <BaseSidebarPanel title="Avatar block">
            <SliderInput
                label="Size"
                iconLabel={<Maximize2 className="h-4 w-4 text-muted-foreground" />}
                units="px"
                step={3}
                min={32}
                max={256}
                defaultValue={size}
                onChange={(size) => updateData({ ...data, props: { ...data.props, size } })}
            />
            <RadioGroupInput
                label="Shape"
                defaultValue={shape}
                onChange={(shape) => updateData({ ...data, props: { ...data.props, shape } })}
            >
                <ToggleGroupItem value="circle">Circle</ToggleGroupItem>
                <ToggleGroupItem value="square">Square</ToggleGroupItem>
                <ToggleGroupItem value="rounded">Rounded</ToggleGroupItem>
            </RadioGroupInput>
            <TextInput
                label="Image URL"
                defaultValue={imageUrl}
                onChange={(imageUrl) => updateData({ ...data, props: { ...data.props, imageUrl } })}
            />
            <TextInput
                label="Alt text"
                defaultValue={alt}
                onChange={(alt) => updateData({ ...data, props: { ...data.props, alt } })}
            />
            <MultiStylePropertyPanel
                names={['textAlign', 'padding']}
                value={data.style}
                onChange={(style) => updateData({ ...data, style })}
            />
        </BaseSidebarPanel>
    );
}
