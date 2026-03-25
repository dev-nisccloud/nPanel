import React, { useState } from 'react';
import { ZodError } from 'zod';
import { MoveVertical } from 'lucide-react';
import { type SpacerProps, SpacerPropsDefaults, SpacerPropsSchema } from '@usewaypoint/block-spacer';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import SliderInput from '../helpers/inputs/SliderInput';

type SpacerSidebarPanelProps = {
    data: SpacerProps;
    setData: (v: SpacerProps) => void;
};

export default function SpacerSidebarPanel({ data, setData }: SpacerSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    return (
        <BaseSidebarPanel title="Spacer block">
            <SliderInput
                label="Height"
                iconLabel={<MoveVertical className="h-4 w-4 text-muted-foreground" />}
                units="px"
                step={4}
                min={4}
                max={128}
                defaultValue={data.props?.height ?? SpacerPropsDefaults.height}
                onChange={(height) => updateData({ ...data, props: { ...data.props, height } })}
            />
        </BaseSidebarPanel>
    );
}
