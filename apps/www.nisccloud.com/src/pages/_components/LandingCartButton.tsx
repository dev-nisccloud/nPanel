import { useCartStore, buildCartHandoffUrl } from "@npanel/cart-store";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { NPANEL_APP } from "@/lib/domain-search/api.ts";

export function LandingCartButton() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const items = useCartStore((state) => state.items);

  return (
    <Button
      size="icon"
      variant="outline"
      className="relative shrink-0 cursor-pointer"
      onClick={() => {
        window.location.href = buildCartHandoffUrl(NPANEL_APP, items);
      }}
      title={itemCount > 0 ? "Continue checkout in nPanel" : "Open nPanel"}
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );
}
