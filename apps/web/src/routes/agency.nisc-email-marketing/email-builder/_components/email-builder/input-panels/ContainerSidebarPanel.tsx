import React, { useState } from 'react';
import { ZodError } from 'zod';
import { type ContainerProps, ContainerPropsSchema } from '@usewaypoint/block-container';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';

type ContainerSidebarPanelProps = {
    data: ContainerProps;
    setData: (v: ContainerProps) => void;
};

export default function ContainerSidebarPanel({ data, setData }: ContainerSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    return (
        <BaseSidebarPanel title="Container block">
            <MultiStylePropertyPanel
                names={['backgroundColor', 'borderColor', 'borderRadius', 'padding']}
                value={data.style}
                onChange={(style) => updateData({ ...data, style })}
            />
        </BaseSidebarPanel>
    );
}
