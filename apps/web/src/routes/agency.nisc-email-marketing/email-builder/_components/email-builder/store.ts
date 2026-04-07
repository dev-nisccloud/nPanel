import { create } from 'zustand';

// We will define these types or port them as well
export type TEditorConfiguration = Record<string, any>;

type TValue = {
    document: TEditorConfiguration;

    selectedBlockId: string | null;
    selectedSidebarTab: 'block-configuration' | 'styles';
    selectedMainTab: 'editor' | 'preview' | 'json' | 'html';
    selectedScreenSize: 'desktop' | 'mobile';

    inspectorDrawerOpen: boolean;
    samplesDrawerOpen: boolean;
};

// Default empty configuration
const DEFAULT_CONFIGURATION: TEditorConfiguration = {
    root: {
        type: 'EmailLayout',
        data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#242424',
            fontFamily: 'MODERN_SANS',
            childrenIds: [],
        },
    },
};

export const useEmailBuilderStore = create<TValue>((set, get) => ({
    document: DEFAULT_CONFIGURATION,
    selectedBlockId: null,
    selectedSidebarTab: 'styles',
    selectedMainTab: 'editor',
    selectedScreenSize: 'desktop',

    inspectorDrawerOpen: true,
    samplesDrawerOpen: false, // Changed from true to false by default for better fit in npanel
}));

export const useDocument = () => useEmailBuilderStore((s) => s.document);
export const useSelectedBlockId = () => useEmailBuilderStore((s) => s.selectedBlockId);
export const useSelectedScreenSize = () => useEmailBuilderStore((s) => s.selectedScreenSize);
export const useSelectedMainTab = () => useEmailBuilderStore((s) => s.selectedMainTab);
export const useSelectedSidebarTab = () => useEmailBuilderStore((s) => s.selectedSidebarTab);
export const useInspectorDrawerOpen = () => useEmailBuilderStore((s) => s.inspectorDrawerOpen);
export const useSamplesDrawerOpen = () => useEmailBuilderStore((s) => s.samplesDrawerOpen);

export const setSelectedMainTab = (selectedMainTab: TValue['selectedMainTab']) =>
    useEmailBuilderStore.setState({ selectedMainTab });

export const setSelectedBlockId = (selectedBlockId: TValue['selectedBlockId']) => {
    const selectedSidebarTab = selectedBlockId === null ? 'styles' : 'block-configuration';
    const options: Partial<TValue> = {};
    if (selectedBlockId !== null) {
        options.inspectorDrawerOpen = true;
    }
    return useEmailBuilderStore.setState({
        selectedBlockId,
        selectedSidebarTab,
        ...options,
    });
};

export const setSidebarTab = (selectedSidebarTab: TValue['selectedSidebarTab']) =>
    useEmailBuilderStore.setState({ selectedSidebarTab });

export const resetDocument = (document: TValue['document']) =>
    useEmailBuilderStore.setState({
        document,
        selectedSidebarTab: 'styles',
        selectedBlockId: null,
    });

export const setDocument = (document: TValue['document']) => {
    const originalDocument = useEmailBuilderStore.getState().document;
    return useEmailBuilderStore.setState({
        document: {
            ...originalDocument,
            ...document,
        },
    });
};

export const toggleInspectorDrawerOpen = () => {
    const inspectorDrawerOpen = !useEmailBuilderStore.getState().inspectorDrawerOpen;
    return useEmailBuilderStore.setState({ inspectorDrawerOpen });
};

export const toggleSamplesDrawerOpen = () => {
    const samplesDrawerOpen = !useEmailBuilderStore.getState().samplesDrawerOpen;
    return useEmailBuilderStore.setState({ samplesDrawerOpen });
};

export const setSelectedScreenSize = (selectedScreenSize: TValue['selectedScreenSize']) =>
    useEmailBuilderStore.setState({ selectedScreenSize });
