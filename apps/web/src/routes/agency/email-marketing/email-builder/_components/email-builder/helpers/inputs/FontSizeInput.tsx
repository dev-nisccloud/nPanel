import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import RawSliderInput from './raw/RawSliderInput';

type Props = {
    label: string;
    defaultValue: number;
    onChange: (v: number) => void;
};

export default function FontSizeInput({ label, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue);

    React.useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = (value: number) => {
        setValue(value);
        onChange(value);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <RawSliderInput
                iconLabel={<Type className="h-4 w-4" />}
                value={value}
                setValue={handleChange}
                units="px"
                step={1}
                min={10}
                max={48}
            />
        </div>
    );
}
