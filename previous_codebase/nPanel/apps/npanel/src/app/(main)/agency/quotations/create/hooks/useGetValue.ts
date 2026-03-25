import { useFormContext } from "react-hook-form";

export const useGetValue = (name: string, defaultValue?: string) => {
	const form = useFormContext();
	const value = form.watch(name);
	return (value as string) || defaultValue || "";
};

export const useItemParams = () => {
	const form = useFormContext();
	return form.watch("items") || [{ itemDescription: "" }];
};
