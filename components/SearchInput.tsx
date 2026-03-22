"use client"

import React from "react"
import { Search, X } from "lucide-react"
import { Input } from "./ui/input"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export function SearchInput({ value, onChange, onClear, className, ...props }: SearchInputProps) {
  const hasValue = value && String(value).length > 0

  return (
    <div className={`relative group ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
      <Input
        value={value}
        onChange={onChange}
        className="w-full h-full pl-9 pr-9 bg-gray-50/50 border-gray-100 focus-visible:bg-white focus-visible:border-primary/30 transition-all rounded-xl"
        {...props}
      />
      {hasValue && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onClear?.()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
