import React from 'react';
import { Container as BaseContainer } from '@usewaypoint/block-container';
import { ColumnsContainer as BaseColumnsContainer } from '@usewaypoint/block-columns-container';
import { useContext } from 'react';
import { useCurrentBlockId, RenderContext, useEditorDocument } from './context';
import { setDocument, setSelectedBlockId } from './store';
import { AddBlockMenu } from './components';
import EditorBlock from './core';

// --- EditorChildrenIds ---

export type EditorChildrenChange = {
    blockId: string;
    block: any;
    childrenIds: string[];
};

function generateId() {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function EditorChildrenIds({ childrenIds, onChange }: { childrenIds: string[] | null | undefined; onChange: (val: EditorChildrenChange) => void }) {
    const { useRawValue } = useContext(RenderContext);
    const appendBlock = (block: any) => {
        const blockId = generateId();
        onChange({
            blockId,
            block,
            childrenIds: [...(childrenIds || []), blockId],
        });
    };

    const insertBlock = (block: any, index: number) => {
        const blockId = generateId();
        const newChildrenIds = [...(childrenIds || [])];
        newChildrenIds.splice(index, 0, blockId);
        onChange({
            blockId,
            block,
            childrenIds: newChildrenIds,
        });
    };

    if (!childrenIds || childrenIds.length === 0) {
        if (useRawValue) return null;
        return <AddBlockMenu placeholder onSelect={appendBlock} />;
    }

    return (
        <>
            {childrenIds.map((childId, i) => (
                <React.Fragment key={childId}>
                    {!useRawValue && <AddBlockMenu onSelect={(block) => insertBlock(block, i)} />}
                    <EditorBlock id={childId} />
                </React.Fragment>
            ))}
            {!useRawValue && <AddBlockMenu onSelect={appendBlock} />}
        </>
    );
}

// --- ContainerEditor ---

export function ContainerEditor({ style, props, data }: any) {
    // Native schema: props.childrenIds, style.{ backgroundColor, padding, borderRadius }
    // Fallback: data.childrenIds (old flat format) or data.props.childrenIds
    const effectiveProps = props ?? data?.props ?? {};
    const childrenIds = effectiveProps.childrenIds ?? data?.childrenIds ?? [];
    const document = useEditorDocument();
    const currentBlockId = useCurrentBlockId();

    return (
        <BaseContainer style={style}>
            <EditorChildrenIds
                childrenIds={childrenIds}
                onChange={({ block, blockId, childrenIds }) => {
                    setDocument({
                        [blockId]: block,
                        [currentBlockId]: {
                            type: 'Container',
                            data: {
                                ...document[currentBlockId].data,
                                props: { childrenIds },
                            },
                        },
                    });
                    setSelectedBlockId(blockId);
                }}
            />
        </BaseContainer>
    );
}

// --- ColumnsContainerEditor ---

export function ColumnsContainerEditor({ style, props }: any) {
    const currentBlockId = useCurrentBlockId();
    const document = useEditorDocument();

    // Native schema: props.columns = [{ childrenIds: [] }, ...]
    const { columns, ...restProps } = props ?? {};
    const columnsValue = columns ?? [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }];

    const updateColumn = (columnIndex: number, { block, blockId, childrenIds }: EditorChildrenChange) => {
        const nColumns = [...columnsValue];
        nColumns[columnIndex] = { childrenIds };
        setDocument({
            [blockId]: block,
            [currentBlockId]: {
                type: 'ColumnsContainer',
                data: {
                    ...document[currentBlockId].data,
                    props: {
                        ...restProps,
                        columns: nColumns,
                    },
                },
            },
        });
        setSelectedBlockId(blockId);
    };

    return (
        <BaseColumnsContainer
            props={restProps}
            style={style}
            columns={[
                <EditorChildrenIds key="0" childrenIds={columnsValue[0]?.childrenIds} onChange={(change) => updateColumn(0, change)} />,
                <EditorChildrenIds key="1" childrenIds={columnsValue[1]?.childrenIds} onChange={(change) => updateColumn(1, change)} />,
                <EditorChildrenIds key="2" childrenIds={columnsValue[2]?.childrenIds} onChange={(change) => updateColumn(2, change)} />,
            ]}
        />
    );
}

// --- EmailLayoutEditor ---

import { getFontFamily } from './helpers/fontFamily';

export function EmailLayoutEditor(data: any) {
    // EmailLayout is stored flat in data (no props/style wrapper)
    // data = { backdropColor, canvasColor, textColor, fontFamily, borderRadius, borderColor, childrenIds }
    const {
        backdropColor,
        canvasColor,
        textColor,
        fontFamily,
        borderRadius,
        borderColor,
        childrenIds = [],
    } = data ?? {};

    const { useRawValue } = useContext(RenderContext);
    const document = useEditorDocument();
    const currentBlockId = useCurrentBlockId();

    return (
        <div
            onClick={() => setSelectedBlockId(null)}
            style={{
                backgroundColor: backdropColor || '#F5F5F5',
                color: textColor || '#262626',
                fontFamily: getFontFamily(fontFamily) ?? fontFamily,
                fontSize: '16px',
                padding: '32px 0',
                width: '100%',
                minHeight: '100%',
            }}
        >
            <table
                align="center"
                width="100%"
                style={{
                    margin: '0 auto',
                    maxWidth: '600px',
                    backgroundColor: canvasColor || '#FFFFFF',
                    borderRadius: borderRadius || undefined,
                    border: borderColor ? `1px solid ${borderColor}` : undefined,
                }}
                role="presentation"
                cellSpacing="0"
                cellPadding="0"
                border={0}
            >
                <tbody>
                    <tr>
                        <td>
                            <EditorChildrenIds
                                childrenIds={childrenIds}
                                onChange={({ block, blockId, childrenIds }) => {
                                    setDocument({
                                        [blockId]: block,
                                        [currentBlockId]: {
                                            type: 'EmailLayout',
                                            data: {
                                                ...document[currentBlockId].data,
                                                childrenIds,
                                            },
                                        },
                                    });
                                    setSelectedBlockId(blockId);
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
