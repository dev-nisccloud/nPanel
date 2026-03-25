 "use client";

 import * as React from "react";
 import { Building2, ChevronDown } from "lucide-react";

 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { cn } from "@/lib/utils";

 export type ETimsBranchOption = {
   bhfId: string;
   bhfNm?: string | null;
 };

 export function ETimsBranchSwitcher({
   branches,
   value,
   onChange,
   className,
 }: {
   branches: ETimsBranchOption[];
   value: string;
   onChange: (bhfId: string) => void;
   className?: string;
 }) {
   const active = React.useMemo(
     () => branches.find((b) => b.bhfId === value) ?? branches[0],
     [branches, value]
   );

   if (!branches?.length) return null;

   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="outline" className={cn("gap-2", className)}>
           <Building2 className="h-4 w-4" />
           <span className="truncate max-w-[220px]">
             {active?.bhfNm ? `${active.bhfNm} (${active.bhfId})` : `Branch ${active?.bhfId ?? value}`}
           </span>
           <ChevronDown className="h-4 w-4 opacity-70" />
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent className="min-w-64" align="end">
         {branches.map((b) => (
           <DropdownMenuItem
             key={b.bhfId}
             className={cn(b.bhfId === value && "bg-accent/50 border-l-primary border-l-2")}
             onClick={() => onChange(b.bhfId)}
           >
             <div className="flex flex-col">
               <span className="font-medium">{b.bhfNm ?? "Headquarter"}</span>
               <span className="text-xs text-muted-foreground">bhfId: {b.bhfId}</span>
             </div>
           </DropdownMenuItem>
         ))}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }

