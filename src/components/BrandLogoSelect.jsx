import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

function getBrandInitial(name) {
  return String(name || "").trim().charAt(0).toUpperCase() || "?";
}

function BrandLogo({ brand, size = "default" }) {
  const [hasImageError, setHasImageError] = useState(false);
  const logoUrl = brand?.logoUrl;
  const showImage = logoUrl && !hasImageError;

  return (
    <span className={`brand-logo brand-logo--${size}`} aria-hidden="true">
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span>{getBrandInitial(brand?.name)}</span>
      )}
    </span>
  );
}

export default function BrandLogoSelect({
  id,
  value,
  brands,
  disabled = false,
  isLoading = false,
  placeholder = "Select brand",
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listboxId = `${id}-listbox`;
  const availableBrands = useMemo(
    () => brands.filter((brand) => brand?.name),
    [brands],
  );
  const selectedBrand = availableBrands.find((brand) => brand.name === value) || null;
  const isDisabled = disabled || isLoading;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const selectedIndex = availableBrands.findIndex((brand) => brand.name === value);
    setActiveIndex(Math.max(0, selectedIndex));

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [availableBrands, isOpen, value]);

  const chooseBrand = (brand) => {
    onChange(brand.name);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActiveOption = (offset) => {
    if (!availableBrands.length) {
      return;
    }

    setActiveIndex((currentIndex) =>
      (currentIndex + offset + availableBrands.length) % availableBrands.length,
    );
  };

  const handleButtonKeyDown = (event) => {
    if (isDisabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (isOpen && availableBrands[activeIndex]) {
        chooseBrand(availableBrands[activeIndex]);
        return;
      }

      setIsOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="brand-logo-select" ref={rootRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`brand-logo-select__button ${
          !selectedBrand ? "brand-logo-select__button--placeholder" : ""
        }`}
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={handleButtonKeyDown}
      >
        {selectedBrand ? <BrandLogo brand={selectedBrand} /> : null}
        <span className="brand-logo-select__value">
          {isLoading ? "Loading brands..." : selectedBrand?.name || placeholder}
        </span>
        <span className="brand-logo-select__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M5.5 7.5 10 12l4.5-4.5" />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className="brand-logo-select__menu">
          {availableBrands.length ? (
            <ul
              id={listboxId}
              className="brand-logo-select__list"
              role="listbox"
              aria-labelledby={id}
            >
              {availableBrands.map((brand, index) => {
                const isSelected = brand.name === selectedBrand?.name;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={brand.id}
                    id={`${listboxId}-option-${brand.id}`}
                    className={`brand-logo-select__option ${
                      isSelected ? "is-selected" : ""
                    } ${isActive ? "is-active" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseBrand(brand)}
                  >
                    <BrandLogo brand={brand} />
                    <span className="brand-logo-select__option-copy">
                      <span className="brand-logo-select__option-name">
                        {brand.name}
                      </span>
                      {brand.isActive === false ? (
                        <span className="brand-logo-select__option-status">
                          Inactive
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span className="brand-logo-select__check" aria-hidden="true">
                        <svg viewBox="0 0 20 20" focusable="false">
                          <path d="m5 10 3 3 7-7" />
                        </svg>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="brand-logo-select__empty">No brands available</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
