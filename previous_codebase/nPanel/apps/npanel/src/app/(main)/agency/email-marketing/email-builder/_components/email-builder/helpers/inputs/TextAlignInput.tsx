import React, { useState } from 'react';
import {
    AlignLeft,
    AlignCenter,
    AlignRight
} from 'lucide-react';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import RadioGroupInput from './RadioGroupInput';

type Props = {
    label: string;
    defaultValue: string | null;
    onChange: (value: string | null) => void;
};

export default function TextAlignInput({ label, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue ?? 'left');

    React.useEffect(() => {
        setValue(defaultValue ?? 'left');
    }, [defaultValue]);

    return (
        <RadioGroupInput
            label={label}
            defaultValue={value}
            onChange={(value) => {
                setValue(value);
                onChange(value);
            }}
        >
            <ToggleGroupItem value="left" aria-label="Align left">
                <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
                <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
                <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
        </RadioGroupInput>
    );
}
