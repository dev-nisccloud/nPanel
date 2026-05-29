"use client";

import * as React from "react";
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

type EmojiInsertPopoverProps = {
	onInsert: (emoji: string) => void;
};

/** Full emoji picker using Twitter Twemoji assets in the grid UI. */
export function EmojiInsertPopover({ onInsert }: EmojiInsertPopoverProps) {
	const [open, setOpen] = React.useState(false);

	const handleClick = (data: EmojiClickData) => {
		onInsert(data.emoji);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="w-full h-9 gap-2 text-sm font-normal"
				>
					<Smile className="size-4 text-muted-foreground" />
					Insert emoji
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0 border shadow-lg"
				align="end"
				side="left"
				sideOffset={8}
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<EmojiPicker
					emojiStyle={EmojiStyle.TWITTER}
					theme={Theme.AUTO}
					lazyLoadEmojis
					searchPlaceholder="Search emoji…"
					onEmojiClick={handleClick}
					width={320}
					height={380}
					previewConfig={{ showPreview: true }}
				/>
			</PopoverContent>
		</Popover>
	);
}
