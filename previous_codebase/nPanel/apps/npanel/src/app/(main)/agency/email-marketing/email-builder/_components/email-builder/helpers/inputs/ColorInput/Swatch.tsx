import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    paletteColors: string[];
    value: string;
    onChange: (value: string) => void;
};

export default function Swatch({ paletteColors, value, onChange }: Props) {
    const renderButton = (colorValue: string) => {
        return (
            <Button
                key={colorValue}
                type="button"
                variant="outline"
                onClick={() => onChange(colorValue)}
                className="w-6 h-6 p-0 min-w-0 rounded border-2"
                style={{
                    backgroundColor: colorValue,
                    borderColor: value === colorValue ? '#000' : '#e5e7eb',
                }}
            />
        );
    };

    return (
        <div className="w-full grid grid-cols-6 gap-1">
            {paletteColors.map((c) => renderButton(c))}
        </div>
    );
}
