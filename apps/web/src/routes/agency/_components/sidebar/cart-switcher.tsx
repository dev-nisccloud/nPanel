"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { CartSheet } from "./cart-sheet";
import { useCartStore } from "@/stores/cart-store";

export function CartSwitcher() {
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const itemCount = useCartStore(state => state.getItemCount());

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  return (
    <>
      <Button size="icon" onClick={handleCartClick} className="relative">
        <Icons.Cart />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount}
          </Badge>
        )}
      </Button>
      
      <CartSheet 
        open={isCartOpen} 
        onOpenChange={setIsCartOpen} 
      />
    </>
  );
}
