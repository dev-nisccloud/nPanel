"use client";
import * as React from "react";
import { useNavigate } from "react-router";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

// Transform sidebar items to search dialog format
const searchItems = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) => {
    // If item has sub-items, only include the sub-items (exclude parent)
    if (item.subItems) {
      return item.subItems.map((subItem) => ({
        group: group.label || "Navigation",
        icon: item.icon, // Use parent icon for sub-items
        label: subItem.title,
        url: subItem.url,
        comingSoon: subItem.comingSoon,
        newTab: subItem.newTab,
        isNew: subItem.isNew,
      }));
    }

    // If item has no sub-items, include the main item
    return [
      {
        group: group.label || "Navigation",
        icon: item.icon,
        label: item.title,
        url: item.url,
        comingSoon: item.comingSoon,
        newTab: item.newTab,
        isNew: item.isNew,
      },
    ];
  })
);

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleSelect = (item: any) => {
    if (item.comingSoon) return; // Don't navigate if coming soon
    
    setOpen(false);
    
    if (item.newTab) {
      // Open in new tab
      window.open(item.url, '_blank');
    } else {
      // Navigate in same tab
      navigate(item.url);
    }
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="link"
        className="text-muted-foreground !px-0 font-normal hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search dashboards, users, and more…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {[...new Set(searchItems.map((item) => item.group))].map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group} key={group}>
                {searchItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <CommandItem 
                      className="!py-1.5" 
                      key={`${item.group}-${item.label}`} 
                      onSelect={() => handleSelect(item)}
                      disabled={item.comingSoon}
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span className="flex-1">{item.label}</span>
                      {item.comingSoon && (
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                      )}
                      {item.isNew && !item.comingSoon && (
                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">New</span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
