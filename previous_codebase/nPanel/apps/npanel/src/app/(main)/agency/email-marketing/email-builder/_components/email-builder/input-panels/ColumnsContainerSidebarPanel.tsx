import React, { useState } from 'react';
import { ZodError } from 'zod';
import { AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Columns3 } from 'lucide-react';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import { ColumnsContainerProps, ColumnsContainerPropsSchema } from '@usewaypoint/block-columns-container';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import ColumnWidthsInput from '../helpers/inputs/ColumnWidthsInput';
import RadioGroupInput from '../helpers/inputs/RadioGroupInput';
import SliderInput from '../helpers/inputs/SliderInput';
import MultiStylePropertyPanel from '../helpers/style-inputs/MultiStylePropertyPanel';

type ColumnsContainerSidebarPanelProps = {
    data: ColumnsContainerProps;
    setData: (v: ColumnsContainerProps) => void;
};

export default function ColumnsContainerSidebarPanel({ data, setData }: ColumnsContainerSidebarPanelProps) {
    const updateData = (d: any) => {
        setData(d);
    };

    const columnsCount = data.props?.columnsCount ?? 3;
    const columnsGap = data.props?.columnsGap ?? 8;
    const fixedWidths = data.props?.fixedWidths ?? null;
    const contentAlignment = data.props?.contentAlignment ?? 'top';

    return (
        <BaseSidebarPanel title="Columns container block">
            <RadioGroupInput
                label="Number of columns"
                defaultValue={String(columnsCount)}
                onChange={(v) => {
                    const columnsCount = parseInt(v, 10) as 2 | 3;
                    updateData({ ...data, props: { ...data.props, columnsCount } });
                }}
            >
                <ToggleGroupItem value="2">2</ToggleGroupItem>
                <ToggleGroupItem value="3">3</ToggleGroupItem>
            </RadioGroupInput>
            <ColumnWidthsInput
                defaultValue={fixedWidths}
                onChange={(fixedWidths) => updateData({ ...data, props: { ...data.props, fixedWidths } })}
            />
            <SliderInput
                label="Columns gap"
                iconLabel={<Columns3 className="h-4 w-4 text-muted-foreground" />}
                units="px"
                step={4}
                min={0}
                max={48}
                defaultValue={columnsGap}
                onChange={(columnsGap) => updateData({ ...data, props: { ...data.props, columnsGap } })}
            />
            <RadioGroupInput
                label="Alignment"
                defaultValue={contentAlignment}
                onChange={(contentAlignment) => updateData({ ...data, props: { ...data.props, contentAlignment } })}
            >
                <ToggleGroupItem value="top" aria-label="Top">
                    <AlignVerticalJustifyStart className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="middle" aria-label="Middle">
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bottom" aria-label="Bottom">
                    <AlignVerticalJustifyEnd className="h-4 w-4" />
                </ToggleGroupItem>
            </RadioGroupInput>
            <MultiStylePropertyPanel
                names={['backgroundColor', 'borderColor', 'borderRadius', 'padding']}
                value={data.style}
                onChange={(style) => updateData({ ...data, style })}
            />
        </BaseSidebarPanel>
    );
}
