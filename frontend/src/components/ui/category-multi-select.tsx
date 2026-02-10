"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  icon?: string | null;
  path?: string | null;
}

interface CategoryMultiSelectProps {
  categories: CategoryOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  className?: string;
  /** Optional label for accessibility */
  label?: string;
  /** Max height of the dropdown list (default 280px) */
  listMaxHeight?: number;
}

export function CategoryMultiSelect({
  categories,
  value,
  onChange,
  placeholder = "Select categories...",
  className,
  label = "Categories",
  listMaxHeight = 280,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const selectedCategories = React.useMemo(
    () => categories.filter((c) => selectedSet.has(c.id)),
    [categories, selectedSet]
  );

  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const pathMatch = c.path?.toLowerCase().includes(q);
      const slugMatch = c.slug.toLowerCase().includes(q);
      return nameMatch || pathMatch || slugMatch;
    });
  }, [categories, search]);

  const toggle = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const remove = (id: number) => onChange(value.filter((x) => x !== id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          className={cn(
            "min-h-10 w-full justify-between gap-2 text-left font-normal",
            !value.length && "text-muted-foreground",
            className
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  size="sm"
                  removable
                  onRemove={() => remove(c.id)}
                  className="max-w-[180px] truncate"
                >
                  {c.icon && <span className="shrink-0">{c.icon}</span>}
                  <span className="truncate">{c.name}</span>
                </Badge>
              ))
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-9 pl-8"
              aria-label="Search categories"
            />
          </div>
        </div>
        <div
          className="overflow-y-auto p-1"
          style={{ maxHeight: listMaxHeight }}
          role="listbox"
          aria-multiselectable
          aria-label={label}
        >
          {filteredCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No categories match &quot;{search}&quot;
            </p>
          ) : (
            filteredCategories.map((c) => (
              <label
                key={c.id}
                role="option"
                aria-selected={selectedSet.has(c.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-muted/60",
                  selectedSet.has(c.id) && "bg-muted/50"
                )}
              >
                <Checkbox
                  checked={selectedSet.has(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                  aria-label={c.name}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {c.icon && <span className="shrink-0 text-base">{c.icon}</span>}
                    <span className="font-medium">{c.name}</span>
                  </div>
                  {c.path && c.path !== c.name && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.path}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
