export type FileCodeEditorProps = {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};
