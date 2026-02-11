import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    label: string;
    defaultValue?: string | number | null;
    onChange: (v: string | null) => void;
};

export default function TextDimensionInput({ label, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue?.toString() || '');

    return (
        <div className="space-y-2 flex-1">
            <Label>{label}</Label>
            <Input
                value={value}
                onChange={(ev) => {
                    const v = ev.target.value;
                    setValue(v);
                    onChange(v.trim().length === 0 ? null : v.trim());
                }}
                placeholder="auto"
            />
        </div>
    );
}
