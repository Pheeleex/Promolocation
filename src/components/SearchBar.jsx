import React from "react";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function SearchBar({
  ariaLabel = "Search",
  className = "",
  onChange,
  placeholder = "Search",
  value,
}) {
  const hasValue = Boolean(value);

  return (
    <div className={`search-bar ${className}`.trim()}>
      <SearchIcon />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {hasValue ? (
        <button
          type="button"
          className="search-bar-clear"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <ClearIcon />
        </button>
      ) : null}
    </div>
  );
}
