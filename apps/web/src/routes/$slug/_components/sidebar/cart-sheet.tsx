"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { useCartStore } from "@/stores/cart-store";

import { CartItemCard } from "./cart-item-card";
import { CartSummary } from "./cart-summary";
import { EmptyCartState } from "./empty-cart-state";
import { captureEvent } from "@/lib/posthog";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, removeItem, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  React.useEffect(() => {
    if (open) {
      captureEvent("storefront_cart_viewed", { items_count: itemCount });
    }
  }, [open]);

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-semibold">Shopping Cart</SheetTitle>
                <SheetDescription className="mt-1">
                  {itemCount === 0 
                    ? "Your cart is empty" 
                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                  }
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          {itemCount === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyCartState />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Cart Items - Explicit height container */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4 space-y-3">
                    {items.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>

              {/* Fixed Bottom Summary */}
              <div className="flex-shrink-0 border-t bg-background">
                <CartSummary />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
