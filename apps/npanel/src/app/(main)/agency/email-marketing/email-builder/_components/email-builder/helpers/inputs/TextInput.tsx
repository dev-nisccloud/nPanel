import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Props = {
    label: string;
    rows?: number;
    placeholder?: string;
    helperText?: React.ReactNode;
    defaultValue: string;
    onChange: (v: string) => void;
};

export default function TextInput({
    helperText,
    label,
    placeholder,
    rows,
    defaultValue,
    onChange
}: Props) {
    const [value, setValue] = useState(defaultValue);
    const isMultiline = typeof rows === 'number' && rows > 1;

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {isMultiline ? (
                <Textarea
                    placeholder={placeholder}
                    value={value}
                    rows={rows}
                    onChange={(ev) => {
                        const v = ev.target.value;
                        setValue(v);
                        onChange(v);
                    }}
                    className="resize-none"
                />
            ) : (
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(ev) => {
                        const v = ev.target.value;
                        setValue(v);
                        onChange(v);
                    }}
                />
            )}
            {helperText && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
}
