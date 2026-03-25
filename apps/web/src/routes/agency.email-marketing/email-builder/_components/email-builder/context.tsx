import { createContext, useContext } from 'react';
import { useDocument } from './store';

export const EditorBlockContext = createContext<string | null>(null);

export const useCurrentBlockId = () => {
    const context = useContext(EditorBlockContext);
    if (!context) throw new Error("useCurrentBlockId must be used within EditorBlockContext");
    return context;
};

export const RenderContext = createContext<{ useRawValue: boolean }>({ useRawValue: false });

export const DocumentContext = createContext<Record<string, any> | null>(null);

export const useEditorDocument = () => {
    const contextDoc = useContext(DocumentContext);
    const storeDoc = useDocument();
    return contextDoc || storeDoc;
};
