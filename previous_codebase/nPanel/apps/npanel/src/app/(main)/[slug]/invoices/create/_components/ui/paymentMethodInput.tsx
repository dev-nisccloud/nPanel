"use client";

import { cn } from "@/lib/utils";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle2, Building2, Smartphone, FileText } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import type { PaymentMethod } from "@/app/(main)/agency/invoices/create/types";

const paymentMethods = [
	{
		value: "bank" as PaymentMethod,
		label: "Bank Transfer",
		icon: Building2,
		description: "Direct bank transfer",
	},
	{
		value: "mpesa" as PaymentMethod,
		label: "MPESA",
		icon: Smartphone,
		description: "Mobile money transfer",
	},
	{
		value: "cheque" as PaymentMethod,
		label: "Cheque",
		icon: FileText,
		description: "Cheque delivery",
	},
];

const PaymentMethodInput = () => {
	const [open, setOpen] = useState(false);

	return (
		<Controller
			name="paymentMethod"
			defaultValue="bank"
			render={({ field: { onChange, value } }) => {
				const selectedMethod =
					paymentMethods.find((method) => method.value === value) ?? paymentMethods[0];

				return (
					<div className="flex group items-center relative h-[52px]">
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild className="w-full">
								<button className="flex gap-2 items-center justify-between w-full">
									<label className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap">
										Payment Method
									</label>
									<div className="flex gap-1.5 bg-neutral-100 text-sm pl-2 pr-2.5 rounded-full py-0.5 items-center">
										<selectedMethod.icon className="w-4 h-4" />
										<p className="font-medium text-sm">{selectedMethod.label}</p>
									</div>
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-full p-0 PopoverContent mt-3">
								<Command className="w-full">
									<CommandInput
										placeholder="Search payment method..."
										className="peer block w-full border-0 py-1.5 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6 placeholder:text-neutral-700/40 placeholder:font-medium caret-orange-500"
									/>
									<CommandEmpty>No payment method found.</CommandEmpty>
									<CommandGroup className="max-h-96 overflow-y-auto scrollbar-hide">
										{paymentMethods.map((method) => (
											<CommandItem
												key={method.value}
												value={method.value}
												onSelect={(currentValue) => {
													const updatedValue =
														currentValue === value ? "bank" : (currentValue as PaymentMethod);
													onChange(updatedValue);
													setOpen(false);
												}}
												className="w-full cursor-pointer my-2"
											>
												<div className="flex gap-2 justify-between items-center w-full">
													<div className="flex gap-2 items-center">
														<method.icon className="w-6 h-6" />
														<div>
															<p className="font-medium">{method.label}</p>
															<p className="font-medium text-neutral-500 text-xs">
																{method.description}
															</p>
														</div>
													</div>
													<CheckCircle2
														className={cn(
															"h-6 w-6 rounded-full",
															value === method.value
																? "opacity-100 bg-orange-500 text-white"
																: "opacity-0",
														)}
													/>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								</Command>
							</PopoverContent>
						</Popover>
						<div
							className={`absolute inset-x-0 bottom-0 border-t border-gray-300  group-focus:border-t border-dashed ${
								open ? "border-orange-500" : "group-hover:border-neutral-400"
							}`}
							aria-hidden="true"
						/>
					</div>
				);
			}}
		/>
	);
};

export default PaymentMethodInput;

