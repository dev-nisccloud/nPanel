"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Icons } from "@/components/icons";
import { useCartStore } from "@/stores/cart-store";

import { CartItemCard } from "./cart-item-card";
import { CartSummary } from "./cart-summary";
import { EmptyCartState } from "./empty-cart-state";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, removeItem, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Icons.Cart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Your Cart</SheetTitle>
              <SheetDescription className="text-base">
                {itemCount === 0 
                  ? "Your cart is empty" 
                  : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout`
                }
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {itemCount === 0 ? (
          <EmptyCartState />
        ) : (
          <div className="flex flex-col h-full">
            {/* Cart Items - Responsive Height Scrollable Container */}
            <div className="h-[650px] md:h-[600px] overflow-y-auto pr-2 mb-8 md:mb-8 pb-20 md:pb-0">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </div>

            {/* Desktop/Tablet Fixed Bottom Section - Cart Summary */}
            <div className="hidden md:flex flex-shrink-0 mt-4">
              <CartSummary />
            </div>
          </div>
        )}

        {/* Mobile Cart Summary - Always rendered for mobile */}
        <div className="md:hidden">
          <CartSummary />
        </div>
      </SheetContent>
    </Sheet>
  );
}
