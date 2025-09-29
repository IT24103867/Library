import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiChevronDown, FiCheck, FiSearch } from 'react-icons/fi';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  dynamicSearch?: boolean;
  onSearch?: (query: string) => Promise<DropdownOption[]>;
  loading?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  disabled = false,
  onOpenChange,
  searchable = false,
  searchPlaceholder = "Search...",
  dynamicSearch = false,
  onSearch,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicOptions, setDynamicOptions] = useState<DropdownOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchTerm('');
        setDynamicOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle dynamic search with debouncing
  useEffect(() => {
    if (!dynamicSearch || !onSearch || !searchTerm.trim()) {
      setDynamicOptions([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(searchTerm.trim());
        setDynamicOptions(results);
      } catch (error) {
        console.error('Search error:', error);
        setDynamicOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, dynamicSearch, onSearch]);

  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(null);

  useEffect(() => {
    // Update selected option when value or options change
    if (dynamicSearch) {
      // For dynamic search, we need to find the selected option from dynamic options or keep the current one
      const found = dynamicOptions.find(option => option.value === value);
      if (found) {
        setSelectedOption(found);
      }
    } else {
      const found = options.find(option => option.value === value);
      setSelectedOption(found || null);
    }
  }, [value, options, dynamicOptions, dynamicSearch]);

  const displayOptions = dynamicSearch ? dynamicOptions : (searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options);

  // For dynamic search, ensure selected option is included and limit to 3 total
  const finalDisplayOptions = dynamicSearch
    ? (() => {
        const baseOptions = displayOptions.slice(0, 3);
        if (selectedOption && !baseOptions.some(opt => opt.value === selectedOption.value)) {
          // Selected option not in top 3, add it at the beginning and take only 3 total
          return [selectedOption, ...baseOptions.slice(0, 2)];
        }
        return baseOptions;
      })()
    : displayOptions;

  const handleSelect = (optionValue: string) => {
    const selected = finalDisplayOptions.find(option => option.value === optionValue);
    if (selected) {
      setSelectedOption(selected);
    }
    onChange(optionValue);
    setIsOpen(false);
    onOpenChange?.(false);
    setSearchTerm('');
    setDynamicOptions([]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            onOpenChange?.(newIsOpen);
          }
        }}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-left
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 ease-in-out
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'hover:border-gray-400 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
          shadow-sm hover:shadow-md
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedOption?.icon && (
              <span className="mr-2 text-gray-500">{selectedOption.icon}</span>
            )}
            <span className={`text-sm font-medium ${selectedOption || value ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedOption ? selectedOption.label : value ? value : placeholder}
            </span>
          </div>
          <FiChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-auto">
            <div className="py-1">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border border-gray-300 border-t-gray-600 mr-2"></div>
                    Searching...
                  </div>
                </div>
              ) : finalDisplayOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                finalDisplayOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                      transition-colors duration-150 flex items-center justify-between
                      ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="mr-2 text-gray-500">{option.icon}</span>
                      )}
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    {value === option.value && (
                      <FiCheck className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;