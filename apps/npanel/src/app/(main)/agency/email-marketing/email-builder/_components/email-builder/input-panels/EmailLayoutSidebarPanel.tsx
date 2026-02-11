import React, { useState } from 'react';
import { ZodError } from 'zod';
import { EmailLayoutProps, EmailLayoutPropsSchema } from '../helpers/EmailLayoutTypes';
import BaseSidebarPanel from '../helpers/BaseSidebarPanel';
import ColorInput, { NullableColorInput } from '../helpers/inputs/ColorInput';
import { NullableFontFamily } from '../helpers/inputs/FontFamily';
import SingleStylePropertyPanel from '../helpers/style-inputs/SingleStylePropertyPanel';

type EmailLayoutSidebarPanelProps = {
    data: EmailLayoutProps;
    setData: (v: EmailLayoutProps) => void;
};

export default function EmailLayoutSidebarPanel({ data, setData }: EmailLayoutSidebarPanelProps) {
    const updateData = (updates: Partial<typeof data.props>) => {
        const newData: EmailLayoutProps = { ...data, props: { ...data.props, ...updates } };
        setData(newData);
    };

    return (
        <BaseSidebarPanel title="Email layout">
            <ColorInput
                label="Backdrop color"
                defaultValue={data.props?.backdropColor ?? '#F5F5F5'}
                onChange={(backdropColor) => updateData({ backdropColor })}
            />
            <ColorInput
                label="Canvas color"
                defaultValue={data.props?.canvasColor ?? '#FFFFFF'}
                onChange={(canvasColor) => updateData({ canvasColor })}
            />
            <NullableColorInput
                label="Canvas border color"
                defaultValue={data.props?.borderColor ?? null}
                onChange={(borderColor) => updateData({ borderColor })}
            />
            <SingleStylePropertyPanel
                name="borderRadius"
                value={data.style || {}}
                onChange={(style) => setData({ ...data, style })}
            />
            <NullableFontFamily
                label="Font family"
                defaultValue={data.props?.fontFamily ?? null}
                onChange={(fontFamily) => updateData({ fontFamily: fontFamily as any })}
            />
            <NullableColorInput
                label="Text color"
                defaultValue={data.props?.textColor ?? null}
                onChange={(textColor) => updateData({ textColor })}
            />
        </BaseSidebarPanel>
    );
}
