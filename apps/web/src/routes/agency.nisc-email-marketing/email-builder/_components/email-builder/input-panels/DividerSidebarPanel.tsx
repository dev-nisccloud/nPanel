import React, { useState } from 'react';
import { ZodError } from 'zod';
import { Minus } from 'lucide-react';
import { type DividerProps, DividerPropsDefaults, DividerPropsSchema } from '@usewaypoint/block-divider';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import { NullableColorInput } from '../helpers/inputs/ColorInput';
import SliderInput from '../helpers/inputs/SliderInput';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';

type DividerSidebarPanelProps = {
    data: DividerProps;
    setData: (v: DividerProps) => void;
};

export default function DividerSidebarPanel({ data, setData }: DividerSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    return (
        <BaseSidebarPanel title="Divider block">
            <NullableColorInput
                label="Line color"
                defaultValue={data.props?.lineColor ?? DividerPropsDefaults.lineColor}
                onChange={(lineColor) => updateData({ ...data, props: { ...data.props, lineColor } })}
            />
            <SliderInput
                label="Line height"
                iconLabel={<Minus className="h-4 w-4 text-muted-foreground" />}
                units="px"
                step={1}
                min={1}
                max={24}
                defaultValue={data.props?.lineHeight ?? DividerPropsDefaults.lineHeight}
                onChange={(lineHeight) => updateData({ ...data, props: { ...data.props, lineHeight } })}
            />
            <MultiStylePropertyPanel
                names={['padding']}
                value={data.style}
                onChange={(style) => updateData({ ...data, style })}
            />
        </BaseSidebarPanel>
    );
}
