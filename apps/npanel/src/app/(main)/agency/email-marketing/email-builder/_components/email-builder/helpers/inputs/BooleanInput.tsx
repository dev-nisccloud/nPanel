import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Props = {
    label: string;
    defaultValue: boolean;
    onChange: (value: boolean) => void;
};

export default function BooleanInput({ label, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="flex items-center justify-between space-x-2">
            <Label htmlFor={`switch-${label}`} className="cursor-pointer flex-1">
                {label}
            </Label>
            <Switch
                id={`switch-${label}`}
                checked={value}
                onCheckedChange={(checked: boolean) => {
                    setValue(checked);
                    onChange(checked);
                }}
            />
        </div>
    );
}
