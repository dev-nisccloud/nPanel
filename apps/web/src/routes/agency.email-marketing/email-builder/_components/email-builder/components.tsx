import React, { useState, ReactNode } from 'react';
import {
    MoreVertical,
    Trash2,
    Copy,
    Plus,
    Type,
    Heading as HeadingIcon,
    Square,
    Image as ImageIcon,
    Minus,
    Space,
    Box,
    Columns,
    Code,
    User,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSelectedBlockId, setSelectedBlockId, setDocument, useDocument } from './store';

// --- EditorBlockWrapper ---

export function EditorBlockWrapper({ children, blockId }: { children: ReactNode; blockId: string }) {
    const selectedBlockId = useSelectedBlockId();
    const [mouseInside, setMouseInside] = useState(false);

    const isSelected = selectedBlockId === blockId;

    const outlineClass = isSelected
        ? 'outline-[2px] outline-blue-500'
        : mouseInside
            ? 'outline-[2px] outline-blue-500/30'
            : 'outline-transparent';

    return (
        <div
            className={`relative max-w-full outline-offset-[-1px] outline ${outlineClass} transition-all duration-200 cursor-pointer`}
            onMouseEnter={(ev) => {
                setMouseInside(true);
                ev.stopPropagation();
            }}
            onMouseLeave={() => {
                setMouseInside(false);
            }}
            onClick={(ev) => {
                setSelectedBlockId(blockId);
                ev.stopPropagation();
                ev.preventDefault();
            }}
        >
            {isSelected && <TuneMenu blockId={blockId} />}
            {children}
        </div>
    );
}

// --- TuneMenu ---

export function TuneMenu({ blockId }: { blockId: string }) {
    const document = useDocument();

    const deleteBlock = (ev: React.MouseEvent) => {
        ev.stopPropagation();
        const newDocument = { ...document };
        delete newDocument[blockId];

        // Also remove from parent childrenIds
        Object.keys(newDocument).forEach(id => {
            const block = newDocument[id];
            if (block.data?.childrenIds?.includes(blockId)) {
                block.data.childrenIds = block.data.childrenIds.filter((cid: string) => cid !== blockId);
            }
            if (block.data?.props?.columns) {
                block.data.props.columns.forEach((col: any) => {
                    if (col.childrenIds?.includes(blockId)) {
                        col.childrenIds = col.childrenIds.filter((cid: string) => cid !== blockId);
                    }
                });
            }
        });

        setDocument(newDocument);
        setSelectedBlockId(null);
    };

    const duplicateBlock = (ev: React.MouseEvent) => {
        ev.stopPropagation();
        const block = document[blockId];
        const newId = `block-${Date.now()}`;
        const newDocument = {
            ...document,
            [newId]: JSON.parse(JSON.stringify(block))
        };

        // Add to parent childrenIds after the current block
        Object.keys(newDocument).forEach(id => {
            const parent = newDocument[id];
            if (parent.data?.childrenIds?.includes(blockId)) {
                const index = parent.data.childrenIds.indexOf(blockId);
                parent.data.childrenIds.splice(index + 1, 0, newId);
            }
            // Note: Columns duplication is more complex, skipping for now
        });

        setDocument(newDocument);
        setSelectedBlockId(newId);
    };

    const moveUp = (ev: React.MouseEvent) => {
        ev.stopPropagation();
        const newDocument = { ...document };
        let parentId: string | null = null;
        let parentChildrenIds: string[] | null = null;
        let index = -1;

        // Find parent
        for (const id in newDocument) {
            const block = newDocument[id];
            if (block.data?.childrenIds?.includes(blockId)) {
                parentId = id;
                parentChildrenIds = block.data.childrenIds;
                index = parentChildrenIds!.indexOf(blockId);
                break;
            }
            if (block.data?.props?.columns) {
                for (const col of block.data.props.columns) {
                    if (col.childrenIds?.includes(blockId)) {
                        parentId = id; // Parent is still the ColumnsContainer
                        parentChildrenIds = col.childrenIds;
                        index = parentChildrenIds!.indexOf(blockId);
                        break;
                    }
                }
                if (parentId) break;
            }
        }

        if (parentChildrenIds && index > 0) {
            // Swap with previous
            [parentChildrenIds[index - 1], parentChildrenIds[index]] = [parentChildrenIds[index], parentChildrenIds[index - 1]];
            setDocument(newDocument);
        }
    };

    const moveDown = (ev: React.MouseEvent) => {
        ev.stopPropagation();
        const newDocument = { ...document };
        let parentId: string | null = null;
        let parentChildrenIds: string[] | null = null;
        let index = -1;

        // Find parent (Same logic as moveUp, could be refactored but keeping inline for simplicity in this context)
        for (const id in newDocument) {
            const block = newDocument[id];
            if (block.data?.childrenIds?.includes(blockId)) {
                parentId = id;
                parentChildrenIds = block.data.childrenIds;
                index = parentChildrenIds!.indexOf(blockId);
                break;
            }
            if (block.data?.props?.columns) {
                for (const col of block.data.props.columns) {
                    if (col.childrenIds?.includes(blockId)) {
                        parentId = id;
                        parentChildrenIds = col.childrenIds;
                        index = parentChildrenIds!.indexOf(blockId);
                        break;
                    }
                }
                if (parentId) break;
            }
        }

        if (parentChildrenIds && index !== -1 && index < parentChildrenIds.length - 1) {
            // Swap with next
            [parentChildrenIds[index], parentChildrenIds[index + 1]] = [parentChildrenIds[index + 1], parentChildrenIds[index]];
            setDocument(newDocument);
        }
    };

    return (
        <div className="absolute right-0 top-0 z-50 -translate-y-full p-1 flex gap-1 bg-blue-500 rounded-t-md">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={moveUp}>
                <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={moveDown}>
                <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={duplicateBlock}>
                <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={deleteBlock}>
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

// --- AddBlockMenu ---

const BLOCK_TYPES = [
    { label: 'Heading', type: 'Heading', icon: HeadingIcon, defaults: { props: { text: 'Heading' } } },
    { label: 'Text', type: 'Text', icon: Type, defaults: { props: { text: 'Add your text here' } } },
    { label: 'Button', type: 'Button', icon: Square, defaults: { props: { text: 'Click me', url: '#' } } },
    { label: 'Image', type: 'Image', icon: ImageIcon, defaults: { props: { url: '' } } },
    { label: 'Divider', type: 'Divider', icon: Minus, defaults: { props: {} } },
    { label: 'Spacer', type: 'Spacer', icon: Space, defaults: { props: { height: 20 } } },
    { label: 'HTML', type: 'Html', icon: Code, defaults: { props: { contents: '<div>Hello World</div>' } } },
    { label: 'Avatar', type: 'Avatar', icon: User, defaults: { props: { fallback: 'U', shape: 'circle' } } },
    { label: 'Container', type: 'Container', icon: Box, defaults: { props: { childrenIds: [] } } },
    { label: 'Columns', type: 'ColumnsContainer', icon: Columns, defaults: { props: { columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }] } } },
];

export function AddBlockMenu({ onSelect, placeholder }: { onSelect: (block: any) => void; placeholder?: boolean }) {
    return (
        <div className={`flex justify-center my-2 group ${placeholder ? 'py-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300' : ''}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 rounded-full border bg-white shadow-sm transition-opacity ${placeholder ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                    <div className="grid grid-cols-2 gap-1 p-1">
                        {BLOCK_TYPES.map((block) => (
                            <DropdownMenuItem
                                key={block.type}
                                className="flex flex-col items-center justify-center gap-2 p-3 h-20 text-center cursor-pointer"
                                onClick={() => onSelect({ type: block.type, data: block.defaults })}
                            >
                                <block.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] font-medium">{block.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
