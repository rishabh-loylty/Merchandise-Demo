"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface Option {
  name: string;
  values: string[];
}

interface OptionsEditorProps {
  value: Option[];
  onChange: (value: Option[]) => void;
}

export function OptionsEditor({ value, onChange }: OptionsEditorProps) {
  const [pendingInputs, setPendingInputs] = React.useState<Record<number, string>>({});

  const handleAddOption = () => {
    onChange([...value, { name: "", values: [] }]);
  };

  const handleRemoveOption = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setPendingInputs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleOptionNameChange = (index: number, newName: string) => {
    onChange(
      value.map((opt, i) => (i === index ? { ...opt, name: newName } : opt))
    );
  };

  const handleAddValue = (index: number, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    // Don't add duplicates
    if (value?.[index]?.values?.includes(trimmed)) {
      setPendingInputs((prev) => ({ ...prev, [index]: "" }));
      return;
    }
    onChange(
      value.map((opt, i) =>
        i === index ? { ...opt, values: [...opt.values, trimmed] } : opt
      )
    );
    setPendingInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    onChange(
      value.map((opt, i) =>
        i === optionIndex
          ? { ...opt, values: opt.values.filter((_, vi) => vi !== valueIndex) }
          : opt
      )
    );
  };

  const handleInputKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValue = pendingInputs[index] || "";
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleAddValue(index, inputValue);
    }
    // Backspace on empty input removes last chip
    if (e.key === "Backspace" && !inputValue && (value?.[index]?.values?.length ?? 0) > 0) {
      handleRemoveValue(index, value?.[index]?.values?.length ?? 0 - 1);
    }
  };

  const getVariantCount = () => {
    const validOptions = value.filter((opt) => opt.name.trim() && opt.values.length > 0);
    if (validOptions.length === 0) return 0;
    return validOptions.reduce((acc, opt) => acc * opt.values.length, 1);
  };

  return (
    <div className="space-y-4 mt-2">
      {value.map((option, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={option.name}
              onChange={(e) => handleOptionNameChange(index, e.target.value)}
              placeholder="Option name (e.g. Color, Size)"
              className="font-semibold"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(index)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[2.25rem] p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
            {option.values.map((val, vi) => (
              <Badge
                key={vi}
                variant="secondary"
                size="default"
                removable
                onRemove={() => handleRemoveValue(index, vi)}
              >
                {val}
              </Badge>
            ))}
            <input
              type="text"
              value={pendingInputs[index] || ""}
              onChange={(e) =>
                setPendingInputs((prev) => ({ ...prev, [index]: e.target.value }))
              }
              onKeyDown={(e) => handleInputKeyDown(index, e)}
              onBlur={() => handleAddValue(index, pendingInputs[index] || "")}
              placeholder={option.values.length === 0 ? "Type a value and press Enter" : "Add more..."}
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleAddOption}>
          Add another option
        </Button>
        {value.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {getVariantCount()} variant{getVariantCount() !== 1 ? "s" : ""} will be generated
          </p>
        )}
      </div>
    </div>
  );
}
