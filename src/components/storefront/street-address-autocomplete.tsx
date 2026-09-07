"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import {
  setFormFieldValue,
  type ParsedCheckoutAddress,
} from "@/lib/address-autocomplete";

type StreetAddressAutocompleteProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name"
> & {
  name?: string;
};

export function StreetAddressAutocomplete({
  name = "address",
  className,
  ...inputProps
}: StreetAddressAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ParsedCheckoutAddress[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/address-suggest?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then(
          (res) =>
            res.json() as Promise<{ suggestions?: ParsedCheckoutAddress[] }>,
        )
        .then((data) => {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSuggestions([]);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function applySuggestion(item: ParsedCheckoutAddress) {
    const form = inputRef.current?.form;
    const line1 = item.line1 || item.label;
    if (inputRef.current) inputRef.current.value = line1;
    setQuery(line1);
    setOpen(false);
    setSuggestions([]);
    if (!form) return;
    setFormFieldValue(form, "address", line1);
    setFormFieldValue(form, "city", item.city);
    setFormFieldValue(form, "region", item.province);
    setFormFieldValue(form, "postalCode", item.postalCode);
    setFormFieldValue(form, "country", item.country);
  }

  return (
    <div className="relative">
      <input
        {...inputProps}
        ref={inputRef}
        required
        name={name}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        placeholder={
          inputProps.placeholder ?? "Start typing your street address"
        }
        onChange={(e) => {
          setQuery(e.target.value);
          inputProps.onChange?.(e);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {loading ? (
        <p className="mt-1 font-sans text-[11px] text-[color:var(--sf-accent-text-55)]">
          Searching addresses…
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto border border-[color:var(--sf-accent-border-15)] bg-white py-1 shadow-lg"
        >
          {suggestions.map((item, index) => (
            <li key={`${item.label}-${index}`} role="option">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left font-sans text-sm text-[color:var(--sf-accent)] hover:bg-[color:var(--sf-nav-hover-wash)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
