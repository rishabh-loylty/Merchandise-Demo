"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface KeyValueEditorProps {
  value: Array<{ key: string; value: string }>;
  onChange: (value: Array<{ key: string; value: string }>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const handleAddRow = () => {
    onChange([...value, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyChange = (index: number, newKey: string) => {
    onChange(
      value.map((item, i) => (i === index ? { ...item, key: newKey } : item))
    );
  };

  const handleValueChange = (index: number, newValue: string) => {
    onChange(
      value.map((item, i) => (i === index ? { ...item, value: newValue } : item))
    );
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
            placeholder={keyPlaceholder}
          />
          <Input
            value={item.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder={valuePlaceholder}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveRow(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={handleAddRow}>
        Add Specification
      </Button>
    </div>
  );
}
