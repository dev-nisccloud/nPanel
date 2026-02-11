import React, { useState } from 'react';
import TextDimensionInput from './TextDimensionInput';

type TWidthValue = string | number | null | undefined;
type FixedWidths = [
    string | number | null | undefined,
    string | number | null | undefined,
    string | number | null | undefined,
];

type ColumnsLayoutInputProps = {
    defaultValue: FixedWidths | null | undefined;
    onChange: (v: FixedWidths | null | undefined) => void;
};

export default function ColumnWidthsInput({ defaultValue, onChange }: ColumnsLayoutInputProps) {
    const [currentValue, setCurrentValue] = useState<[TWidthValue, TWidthValue, TWidthValue]>(() => {
        if (defaultValue) {
            return defaultValue;
        }
        return [null, null, null];
    });

    const setIndexValue = (index: 0 | 1 | 2, value: string | null) => {
        const nValue: FixedWidths = [...currentValue];
        nValue[index] = value;
        setCurrentValue(nValue);
        onChange(nValue);
    };

    return (
        <div className="flex gap-2">
            <TextDimensionInput
                label="Column 1"
                defaultValue={currentValue?.[0]}
                onChange={(v) => setIndexValue(0, v)}
            />
            <TextDimensionInput
                label="Column 2"
                defaultValue={currentValue?.[1]}
                onChange={(v) => setIndexValue(1, v)}
            />
            <TextDimensionInput
                label="Column 3"
                defaultValue={currentValue?.[2]}
                onChange={(v) => setIndexValue(2, v)}
            />
        </div>
    );
}
