"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { PREDEFINED_BOTTLE_FORMATS } from "@/lib/bottle-formats";
import { cn } from "@/lib/utils";

type BottleFormatSelectorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  allowAllOption?: boolean;
  allOptionLabel?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
};

/**
 * Sélecteur de grammage de bouteille avec dropdown personnalisé.
 * Remplace l'ancien BottleFormatSearchField basé sur <datalist> qui ne
 * fonctionnait pas correctement sur mobile et avait des problèmes de z-index.
 *
 * Fonctionnalités :
 * - Dropdown qui s'ouvre au clic (pas au focus seulement)
 * - Fonctionne sur mobile et desktop
 * - Z-index correct (portal ou position fixed)
 * - Recherche/filtrage en temps réel
 * - Saisie libre autorisée
 * - Accessible au clavier (ArrowUp/Down, Enter, Escape)
 */
export function BottleFormatSelector({
  id,
  value,
  onChange,
  className,
  inputClassName,
  placeholder = "Tous les formats ou saisir un grammage",
  allowAllOption = true,
  allOptionLabel = "Tous les formats",
  label,
  error,
  disabled = false,
  required = false,
}: BottleFormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // All formats: predefined + "Tous les formats" option + custom value if not in list
  const allOptions = useMemo(() => {
    const options = [...PREDEFINED_BOTTLE_FORMATS];
    if (allowAllOption) {
      options.unshift(allOptionLabel);
    }
    // Add current value if it's custom and not empty
    if (value && !options.includes(value) && value !== allOptionLabel) {
      options.unshift(value);
    }
    return options;
  }, [value, allowAllOption, allOptionLabel]);

  const filteredOptions = allOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(allowAllOption ? 0 : -1);
        return;
      }

      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            const selectedValue = filteredOptions[highlightedIndex];
            onChange(selectedValue === allOptionLabel ? "" : selectedValue);
            setIsOpen(false);
            setSearchQuery("");
            setHighlightedIndex(-1);
            inputRef.current?.blur();
          } else if (searchQuery.trim()) {
            // Allow custom value
            onChange(searchQuery.trim());
            setIsOpen(false);
            setSearchQuery("");
            setHighlightedIndex(-1);
            inputRef.current?.blur();
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
        case "Tab":
          // Allow tab to close naturally
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, allowAllOption, allOptionLabel, onChange]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchQuery(newValue);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
    // Don't call onChange here - wait for selection or blur
  };

  const handleBlur = () => {
    // Delay to allow click on option to register
    setTimeout(() => {
      if (searchQuery.trim() && !allOptions.includes(searchQuery.trim())) {
        // Custom value entered
        onChange(searchQuery.trim());
      } else if (value && !allOptions.includes(value)) {
        // Keep existing value if it's not in options
        onChange(value);
      }
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleOptionClick = (option: string) => {
    const finalValue = option === allOptionLabel ? "" : option;
    onChange(finalValue);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const displayValue = value === "" && allowAllOption ? allOptionLabel : value;

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-11 w-full rounded-xl border border-border bg-background pr-12 text-sm text-foreground shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary",
              "placeholder:text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed bg-muted",
              error && "border-destructive focus-visible:ring-destructive/40 focus-visible:border-destructive",
              inputClassName
            )}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls={`${id}-dropdown`}
            role="combobox"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isOpen) {
                setIsOpen(false);
                setSearchQuery("");
                setHighlightedIndex(-1);
              } else {
                setIsOpen(true);
              }
              inputRef.current?.focus();
            }}
            className="pointer-events-none absolute right-3 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-hidden="true"
            tabIndex={-1}
          >
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-10 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer la sélection"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            id={`${id}-dropdown`}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            role="listbox"
            aria-label="Formats de bouteilles"
          >
            <div className="bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-64">
              {allowAllOption && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => handleOptionClick(allOptionLabel)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition-colors",
                    value === ""
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Search className="size-4 shrink-0" />
                    {allOptionLabel}
                  </span>
                </button>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions
                  .filter((opt) => opt !== allOptionLabel)
                  .map((option, index) => {
                    const globalIndex = allOptions.indexOf(option);
                    const isSelected = value === option;
                    const isHighlighted = highlightedIndex === globalIndex;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-highlighted={isHighlighted}
                        onClick={() => handleOptionClick(option)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted",
                          isHighlighted && "bg-muted"
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                {filteredOptions.length === 0 && searchQuery && (
                  <button
                    type="button"
                    role="option"
                    onClick={() => handleOptionClick(searchQuery.trim())}
                    className="w-full px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-4 shrink-0" />
                      Ajouter «&nbsp;{searchQuery.trim()}&nbsp;»
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

import { useMemo } from "react";

// Re-export for convenience
export { PREDEFINED_BOTTLE_FORMATS } from "@/lib/bottle-formats";