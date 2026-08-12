import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  label?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  disabled = false,
  searchable = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position state for portal dropdown
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Estimated max height of dropdown

      // Determine if dropdown should pop UP or DOWN
      const spaceBelow = viewportHeight - rect.bottom;
      const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: placeAbove ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        placeAbove,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full px-4 py-3.5 bg-white border-2 rounded-2xl text-xs font-normal flex items-center justify-between transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'border-emerald-800 ring-2 ring-emerald-700/20'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <span className={`truncate pr-2 ${selectedOption ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-emerald-800 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu rendered via React Portal directly into body to avoid overflow clipping */}
      {isOpen &&
        !disabled &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              ...(coords.placeAbove
                ? { bottom: `${window.innerHeight - coords.top}px` }
                : { top: `${coords.top}px` }),
              zIndex: 99999,
            }}
            className={`bg-white border-2 border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-150 max-h-64 flex flex-col ${
              coords.placeAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
            }`}
          >
            {/* Optional Search Bar */}
            {searchable && (
              <div className="p-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto p-1.5 space-y-1 flex-1">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs font-bold text-slate-400">Tidak ada pilihan.</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-normal flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
