import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Props = {
    label: React.ReactNode;
    children: React.ReactNode;
    defaultValue: string;
    onChange: (v: string) => void;
};

export default function RadioGroupInput({ label, children, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(v: string) => {
                    if (v) {
                        setValue(v);
                        onChange(v);
                    }
                }}
                className="justify-start"
            >
                {children}
            </ToggleGroup>
        </div>
    );
}
