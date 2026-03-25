import React from 'react';

type SidebarPanelProps = {
    title: string;
    children: React.ReactNode;
};

export default function BaseSidebarPanel({ title, children }: SidebarPanelProps) {
    return (
        <div className="p-4 pb-10">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                {title}
            </h3>
            <div className="space-y-5">
                {children}
            </div>
        </div>
    );
}
