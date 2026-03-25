import React from 'react';
import { Slider } from '@/components/ui/slider';

type SliderInputProps = {
    iconLabel: React.ReactNode;
    step?: number;
    marks?: boolean;
    units: string;
    min?: number;
    max?: number;
    value: number;
    setValue: (v: number) => void;
};

export default function RawSliderInput({
    iconLabel,
    value,
    setValue,
    units,
    step = 1,
    min = 0,
    max = 100,
    marks, // Destructure to prevent passing to Slider
    ...props
}: SliderInputProps) {
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="min-w-[24px] shrink-0 text-muted-foreground flex items-center justify-center">
                {iconLabel}
            </div>
            <Slider
                value={[value]}
                onValueChange={(values) => setValue(values[0])}
                min={min}
                max={max}
                step={step}
                className="flex-1"
                {...props}
            />
            <div className="min-w-[48px] text-right shrink-0">
                <span className="text-sm text-muted-foreground">
                    {value}{units}
                </span>
            </div>
        </div>
    );
}
