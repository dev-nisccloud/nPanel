"use client";

import * as React from "react";
import { ShoppingCart, Search, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyCartState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {/* Empty Cart Icon */}
        <div className="p-4 bg-muted/50 rounded-full mb-4">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        
        {/* Empty State Text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start building your online presence by adding domains, hosting plans, or services to your cart.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Domains
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            Browse Services
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Helpful Tips */}
        <div className="mt-8 text-sm text-muted-foreground space-y-2">
          <p className="font-medium">💡 Quick Tips:</p>
          <ul className="text-left space-y-1">
            <li>• Search for your perfect domain name</li>
            <li>• Add hosting plans for your websites</li>
            <li>• Include professional services</li>
            <li>• Review everything before checkout</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
