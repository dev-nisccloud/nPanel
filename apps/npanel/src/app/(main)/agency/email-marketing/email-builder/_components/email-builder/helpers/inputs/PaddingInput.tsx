import React, { useState } from 'react';
import {
    AlignVerticalSpaceAround,
    AlignHorizontalSpaceAround
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import RawSliderInput from './raw/RawSliderInput';

type TPaddingValue = {
    top: number;
    bottom: number;
    right: number;
    left: number;
};

type Props = {
    label: string;
    defaultValue: TPaddingValue | null;
    onChange: (value: TPaddingValue) => void;
};

export default function PaddingInput({ label, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(() => {
        if (defaultValue) {
            return defaultValue;
        }
        return {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
        };
    });

    React.useEffect(() => {
        if (defaultValue) {
            setValue(defaultValue);
        }
    }, [defaultValue]);

    function handleChange(internalName: keyof TPaddingValue, nValue: number) {
        const v = {
            ...value,
            [internalName]: nValue,
        };
        setValue(v);
        onChange(v);
    }

    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            <RawSliderInput
                iconLabel={<span className="text-xs font-medium">T</span>}
                value={value.top}
                setValue={(num) => handleChange('top', num)}
                units="px"
                step={4}
                min={0}
                max={80}
            />

            <RawSliderInput
                iconLabel={<span className="text-xs font-medium">B</span>}
                value={value.bottom}
                setValue={(num) => handleChange('bottom', num)}
                units="px"
                step={4}
                min={0}
                max={80}
            />

            <RawSliderInput
                iconLabel={<span className="text-xs font-medium">L</span>}
                value={value.left}
                setValue={(num) => handleChange('left', num)}
                units="px"
                step={4}
                min={0}
                max={80}
            />

            <RawSliderInput
                iconLabel={<span className="text-xs font-medium">R</span>}
                value={value.right}
                setValue={(num) => handleChange('right', num)}
                units="px"
                step={4}
                min={0}
                max={80}
            />
        </div>
    );
}
