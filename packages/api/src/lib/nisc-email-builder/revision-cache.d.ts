export type RevisionSnapshot = {
    html: string;
    savedAt: string;
};
export declare function isRevisionCacheAvailable(): boolean;
export declare function getRevisionUndoRedoState(designId: string): Promise<{
    available: boolean;
    canUndo: boolean;
    canRedo: boolean;
}>;
export declare function pushRevisionUndoSnapshot(designId: string, html: string): Promise<void>;
export declare function clearRevisionRedoStack(designId: string): Promise<void>;
export declare function popRevisionUndoSnapshot(designId: string): Promise<RevisionSnapshot | null>;
export declare function pushRevisionRedoSnapshot(designId: string, html: string): Promise<void>;
export declare function popRevisionRedoSnapshot(designId: string): Promise<RevisionSnapshot | null>;
