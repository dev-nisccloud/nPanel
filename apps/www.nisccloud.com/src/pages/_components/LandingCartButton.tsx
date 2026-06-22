import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export function LandingCartButton() {
  return (
    <Button
      size="icon"
      variant="outline"
      className="relative shrink-0 cursor-pointer"
      asChild
      title="View cart"
    >
      <Link to="/cart">
        <ShoppingCart className="h-4 w-4" />
      </Link>
    </Button>
  );
}
