import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import Picker from './Picker';

type Props =
    | {
        nullable: true;
        label: string;
        onChange: (value: string | null) => void;
        defaultValue: string | null;
    }
    | {
        nullable: false;
        label: string;
        onChange: (value: string) => void;
        defaultValue: string;
    };

export default function BaseColorInput({ label, defaultValue, onChange, nullable }: Props) {
    const [anchorEl, setAnchorEl] = useState(false);
    const [value, setValue] = useState(defaultValue);

    const renderResetButton = () => {
        if (!nullable) {
            return null;
        }
        if (typeof value !== 'string' || value.trim().length === 0) {
            return null;
        }
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                    setValue(null);
                    onChange(null);
                }}
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </Button>
        );
    };

    const renderOpenButton = () => {
        if (value) {
            return (
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    style={{ backgroundColor: value }}
                />
            );
        }
        return (
            <Button variant="outline" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
            </Button>
        );
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Popover open={anchorEl} onOpenChange={setAnchorEl}>
                    <PopoverTrigger asChild>
                        {renderOpenButton()}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Picker
                            value={value || ''}
                            onChange={(v) => {
                                setValue(v);
                                onChange(v as any);
                            }}
                        />
                    </PopoverContent>
                </Popover>
                {renderResetButton()}
            </div>
        </div>
    );
}
