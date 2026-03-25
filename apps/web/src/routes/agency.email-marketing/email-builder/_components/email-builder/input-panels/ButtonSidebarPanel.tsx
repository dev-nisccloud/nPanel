import React, { useState } from 'react';
import { ZodError } from 'zod';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import { type ButtonProps, ButtonPropsDefaults, ButtonPropsSchema } from '@usewaypoint/block-button';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import ColorInput from '../helpers/inputs/ColorInput';
import RadioGroupInput from '../helpers/inputs/RadioGroupInput';
import TextInput from '../helpers/inputs/TextInput';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';

type ButtonSidebarPanelProps = {
    data: ButtonProps;
    setData: (v: ButtonProps) => void;
};

export default function ButtonSidebarPanel({ data, setData }: ButtonSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    const text = data.props?.text ?? ButtonPropsDefaults.text;
    const url = data.props?.url ?? ButtonPropsDefaults.url;
    const fullWidth = data.props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
    const size = data.props?.size ?? ButtonPropsDefaults.size;
    const buttonStyle = data.props?.buttonStyle ?? ButtonPropsDefaults.buttonStyle;
    const buttonTextColor = data.props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
    const buttonBackgroundColor = data.props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

    return (
        <BaseSidebarPanel title="Button block">
            <TextInput
                label="Text"
                defaultValue={text}
                onChange={(text) => updateData({ ...data, props: { ...data.props, text } })}
            />
            <TextInput
                label="URL"
                defaultValue={url}
                onChange={(url) => updateData({ ...data, props: { ...data.props, url } })}
            />
            <RadioGroupInput
                label="Width"
                defaultValue={fullWidth ? 'FULL_WIDTH' : 'AUTO'}
                onChange={(v) => updateData({ ...data, props: { ...data.props, fullWidth: v === 'FULL_WIDTH' } })}
            >
                <ToggleGroupItem value="FULL_WIDTH">Full</ToggleGroupItem>
                <ToggleGroupItem value="AUTO">Auto</ToggleGroupItem>
            </RadioGroupInput>
            <RadioGroupInput
                label="Size"
                defaultValue={size}
                onChange={(size) => updateData({ ...data, props: { ...data.props, size } })}
            >
                <ToggleGroupItem value="x-small">Xs</ToggleGroupItem>
                <ToggleGroupItem value="small">Sm</ToggleGroupItem>
                <ToggleGroupItem value="medium">Md</ToggleGroupItem>
                <ToggleGroupItem value="large">Lg</ToggleGroupItem>
            </RadioGroupInput>
            <RadioGroupInput
                label="Style"
                defaultValue={buttonStyle}
                onChange={(buttonStyle) => updateData({ ...data, props: { ...data.props, buttonStyle } })}
            >
                <ToggleGroupItem value="rectangle">Rectangle</ToggleGroupItem>
                <ToggleGroupItem value="rounded">Rounded</ToggleGroupItem>
                <ToggleGroupItem value="pill">Pill</ToggleGroupItem>
            </RadioGroupInput>
            <ColorInput
                label="Text color"
                defaultValue={buttonTextColor}
                onChange={(buttonTextColor) => updateData({ ...data, props: { ...data.props, buttonTextColor } })}
            />
            <ColorInput
                label="Button color"
                defaultValue={buttonBackgroundColor}
                onChange={(buttonBackgroundColor) => updateData({ ...data, props: { ...data.props, buttonBackgroundColor } })}
            />
            <MultiStylePropertyPanel
                names={['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
                value={data.style}
                onChange={(style) => updateData({ ...data, style })}
            />
        </BaseSidebarPanel>
    );
}
