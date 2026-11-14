import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchSuggestions, type SearchSuggestion } from "@/lib/market";

const KIND_LABEL: Record<SearchSuggestion["kind"], string> = {
  marca: "Marca",
  modelo: "Modelo",
  ciudad: "Ciudad",
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Campo de búsqueda con sugerencias (marcas, modelos y ciudades con anuncios activos). */
export function SearchSuggestInput({ value, onChange, placeholder }: Props) {
  const [items, setItems] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  // Evita reabrir la lista justo después de elegir una sugerencia.
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      searchSuggestions({ data: { q: value } })
        .then((res) => {
          if (cancelled) return;
          setItems(res);
          setActive(-1);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(s: SearchSuggestion) {
    skipNext.current = true;
    onChange(s.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-autocomplete="list"
        autoComplete="off"
        suppressHydrationWarning
      />
      {open && items.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {!value.trim() && (
            <li className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              Búsquedas populares
            </li>
          )}
          {items.map((s, i) => (
            <li key={`${s.kind}-${s.value}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-elevated ${
                  i === active ? "bg-elevated" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="text-fg">{s.value}</span>
                <span className="text-xs text-subtle">{KIND_LABEL[s.kind]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
