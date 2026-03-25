import React, { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import Swatch from './Swatch';

const DEFAULT_PRESET_COLORS = [
    '#E11D48',
    '#DB2777',
    '#C026D3',
    '#9333EA',
    '#7C3AED',
    '#4F46E5',
    '#2563EB',
    '#0284C7',
    '#0891B2',
    '#0D9488',
    '#059669',
    '#16A34A',
    '#65A30D',
    '#CA8A04',
    '#D97706',
    '#EA580C',
    '#DC2626',
    '#FFFFFF',
    '#FAFAFA',
    '#F5F5F5',
    '#E5E5E5',
    '#D4D4D4',
    '#A3A3A3',
    '#737373',
    '#525252',
    '#404040',
    '#262626',
    '#171717',
    '#0A0A0A',
    '#000000',
];

type Props = {
    value: string;
    onChange: (v: string) => void;
};

export default function Picker({ value, onChange }: Props) {
    const [internalValue, setInternalValue] = useState(value);

    const handleChange = (v: string) => {
        setInternalValue(v);
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            onChange(v);
        }
    };

    return (
        <div className="p-3 space-y-3 w-[240px]">
            <HexColorPicker color={value} onChange={handleChange} className="!w-full" />
            <Swatch
                paletteColors={DEFAULT_PRESET_COLORS}
                value={value}
                onChange={handleChange}
            />
            <div className="pt-2">
                <HexColorInput
                    prefixed
                    color={internalValue}
                    onChange={handleChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
            </div>
        </div>
    );
}
