import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS_PER_PAGE = 12;

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3.5 9.5h17" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
    </svg>
  );
}

function ChevronIcon({ direction = "down" }) {
  const path =
    direction === "left"
      ? "m15 18-6-6 6-6"
      : direction === "right"
        ? "m9 6 6 6-6 6"
        : "m6 9 6 6 6-6";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value) {
  const date = parseDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function FieldShell({
  children,
  className = "",
  error,
  hint,
  id,
  label,
  required = false,
}) {
  return (
    <div className={`ui-field ${className}`.trim()}>
      {label ? (
        <label className="ui-field__label" htmlFor={id}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="ui-field__message ui-field__message--error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field__message">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput(
  { className = "", error, hint, id, label, required, ...inputProps },
  ref,
) {
  return (
    <FieldShell
      className={className}
      error={error}
      hint={hint}
      id={id}
      label={label}
      required={required}
    >
      <input
        ref={ref}
        id={id}
        className="ui-control ui-control--text"
        required={required}
        {...inputProps}
      />
    </FieldShell>
  );
});

export const TextArea = forwardRef(function TextArea(
  { className = "", error, hint, id, label, required, rows = 4, ...textareaProps },
  ref,
) {
  return (
    <FieldShell
      className={className}
      error={error}
      hint={hint}
      id={id}
      label={label}
      required={required}
    >
      <textarea
        ref={ref}
        id={id}
        className="ui-control ui-control--textarea"
        required={required}
        rows={rows}
        {...textareaProps}
      />
    </FieldShell>
  );
});

export const SelectInput = forwardRef(function SelectInput(
  { children, className = "", error, hint, id, label, required, ...selectProps },
  ref,
) {
  return (
    <FieldShell
      className={className}
      error={error}
      hint={hint}
      id={id}
      label={label}
      required={required}
    >
      <select
        ref={ref}
        id={id}
        className="ui-control ui-control--select"
        required={required}
        {...selectProps}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const DateInput = forwardRef(function DateInput(
  {
    className = "",
    disabled = false,
    error,
    hint,
    id,
    label,
    max,
    min,
    name,
    onChange,
    onValueChange,
    placeholder = "Select date",
    required,
    value = "",
    ...inputProps
  },
  ref,
) {
  const today = useMemo(() => new Date(), []);
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("days");
  const [viewMonth, setViewMonth] = useState(
    selectedDate?.getMonth() ?? today.getMonth(),
  );
  const [viewYear, setViewYear] = useState(
    selectedDate?.getFullYear() ?? today.getFullYear(),
  );
  const [yearPageStart, setYearPageStart] = useState(
    Math.floor((selectedDate?.getFullYear() ?? today.getFullYear()) / YEARS_PER_PAGE) *
      YEARS_PER_PAGE,
  );
  const containerRef = useRef(null);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setViewMode("days");
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const setValue = useCallback(
    (nextValue) => {
      onValueChange?.(nextValue);
      onChange?.({
        target: {
          id,
          name,
          value: nextValue,
        },
      });
    },
    [id, name, onChange, onValueChange],
  );

  const isDisabledDay = useCallback(
    (year, month, day) => {
      const date = new Date(year, month, day);
      if (minDate && date < minDate) {
        return true;
      }

      if (maxDate && date > maxDate) {
        return true;
      }

      return false;
    },
    [min, max],
  );

  const isMonthDisabled = useCallback(
    (year, month) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      if (minDate && lastDay < minDate) {
        return true;
      }

      if (maxDate && firstDay > maxDate) {
        return true;
      }

      return false;
    },
    [min, max],
  );

  const isYearDisabled = useCallback(
    (year) => {
      if (minDate && year < minDate.getFullYear()) {
        return true;
      }

      if (maxDate && year > maxDate.getFullYear()) {
        return true;
      }

      return false;
    },
    [min, max],
  );

  const previousPage = () => {
    if (viewMode === "years") {
      setYearPageStart((currentYear) => currentYear - YEARS_PER_PAGE);
      return;
    }

    if (viewMode === "months") {
      setViewYear((currentYear) => currentYear - 1);
      return;
    }

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((currentYear) => currentYear - 1);
    } else {
      setViewMonth((currentMonth) => currentMonth - 1);
    }
  };

  const nextPage = () => {
    if (viewMode === "years") {
      setYearPageStart((currentYear) => currentYear + YEARS_PER_PAGE);
      return;
    }

    if (viewMode === "months") {
      setViewYear((currentYear) => currentYear + 1);
      return;
    }

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((currentYear) => currentYear + 1);
    } else {
      setViewMonth((currentMonth) => currentMonth + 1);
    }
  };

  const handleHeaderClick = () => {
    if (viewMode === "days") {
      setYearPageStart(Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE);
      setViewMode("years");
      return;
    }

    if (viewMode === "years") {
      setViewMode("months");
      return;
    }

    setViewMode("days");
  };

  const selectDate = (day) => {
    setValue(toDateValue(new Date(viewYear, viewMonth, day)));
    setIsOpen(false);
  };

  const selectMonth = (month) => {
    setViewMonth(month);
    setViewMode("days");
  };

  const selectYear = (year) => {
    setViewYear(year);
    setViewMode("months");
  };

  const selectToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setValue(toDateValue(today));
    setIsOpen(false);
  };

  const cells = [
    ...Array(startDayOfMonth(viewYear, viewMonth)).fill(null),
    ...Array.from(
      { length: daysInMonth(viewYear, viewMonth) },
      (_, dayIndex) => dayIndex + 1,
    ),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const yearCells = Array.from(
    { length: YEARS_PER_PAGE },
    (_, index) => yearPageStart + index,
  );
  const headerLabel =
    viewMode === "years"
      ? `${yearPageStart} - ${yearPageStart + YEARS_PER_PAGE - 1}`
      : viewMode === "months"
        ? String(viewYear)
        : `${MONTHS[viewMonth]} ${viewYear}`;
  const inputId = id || name;

  return (
    <FieldShell
      className={`ui-date-picker ${className}`.trim()}
      error={error}
      hint={hint}
      id={inputId}
      label={label}
      required={required}
    >
      <div className="ui-date-picker__root" ref={containerRef}>
        <input
          ref={ref}
          type="hidden"
          id={inputId ? `${inputId}Value` : undefined}
          name={name}
          value={value}
          readOnly
          required={required}
          {...inputProps}
        />
        <button
          type="button"
          id={inputId}
          className={`ui-control ui-date-picker__trigger ${
            isOpen ? "is-open" : ""
          } ${value ? "has-value" : ""}`.trim()}
          disabled={disabled}
          onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        >
          <span className="ui-date-picker__icon">
            <CalendarIcon />
          </span>
          <span className="ui-date-picker__value">
            {value ? formatDateDisplay(value) : placeholder}
          </span>
          <span className="ui-date-picker__chevron">
            <ChevronIcon />
          </span>
        </button>

        {isOpen ? (
          <div className="ui-date-picker__popover">
            <div className="ui-date-picker__header">
              <button
                type="button"
                className="ui-date-picker__nav"
                aria-label="Previous"
                onClick={previousPage}
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                className="ui-date-picker__title"
                onClick={handleHeaderClick}
              >
                {headerLabel}
              </button>
              <button
                type="button"
                className="ui-date-picker__nav"
                aria-label="Next"
                onClick={nextPage}
              >
                <ChevronIcon direction="right" />
              </button>
            </div>

            {viewMode === "years" ? (
              <div className="ui-date-picker__grid ui-date-picker__grid--years">
                {yearCells.map((year) => {
                  const isCurrentYear = year === today.getFullYear();
                  const isSelectedYear = year === viewYear;
                  const disabledYear = isYearDisabled(year);

                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={disabledYear}
                      className={`ui-date-picker__option ${
                        isSelectedYear ? "is-selected" : ""
                      } ${isCurrentYear ? "is-today" : ""}`.trim()}
                      onClick={() => selectYear(year)}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {viewMode === "months" ? (
              <div className="ui-date-picker__grid ui-date-picker__grid--months">
                {MONTHS_SHORT.map((month, monthIndex) => {
                  const isCurrentMonth =
                    monthIndex === today.getMonth() &&
                    viewYear === today.getFullYear();
                  const isSelectedMonth =
                    selectedDate &&
                    monthIndex === selectedDate.getMonth() &&
                    viewYear === selectedDate.getFullYear();
                  const disabledMonth = isMonthDisabled(viewYear, monthIndex);

                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={disabledMonth}
                      className={`ui-date-picker__option ${
                        isSelectedMonth ? "is-selected" : ""
                      } ${isCurrentMonth ? "is-today" : ""}`.trim()}
                      onClick={() => selectMonth(monthIndex)}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {viewMode === "days" ? (
              <>
                <div className="ui-date-picker__weekdays">
                  {DAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="ui-date-picker__days">
                  {cells.map((day, index) => {
                    if (!day) {
                      return <span key={`empty-${index}`} />;
                    }

                    const disabledDay = isDisabledDay(viewYear, viewMonth, day);
                    const isToday =
                      day === today.getDate() &&
                      viewMonth === today.getMonth() &&
                      viewYear === today.getFullYear();
                    const isSelected =
                      selectedDate &&
                      day === selectedDate.getDate() &&
                      viewMonth === selectedDate.getMonth() &&
                      viewYear === selectedDate.getFullYear();

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabledDay}
                        className={`ui-date-picker__day ${
                          isSelected ? "is-selected" : ""
                        } ${isToday ? "is-today" : ""}`.trim()}
                        onClick={() => selectDate(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {!isDisabledDay(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                ) ? (
                  <div className="ui-date-picker__footer">
                    <button type="button" onClick={selectToday}>
                      Today
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
});

export const FileInput = forwardRef(function FileInput(
  { className = "", error, hint, id, label, required, ...inputProps },
  ref,
) {
  return (
    <FieldShell
      className={className}
      error={error}
      hint={hint}
      id={id}
      label={label}
      required={required}
    >
      <input
        ref={ref}
        id={id}
        type="file"
        className="ui-control ui-control--file"
        required={required}
        {...inputProps}
      />
    </FieldShell>
  );
});

export function Button({
  children,
  className = "",
  disabled = false,
  isLoading = false,
  loadingText,
  variant = "primary",
  ...buttonProps
}) {
  return (
    <button
      className={`ui-button ui-button--${variant} ${className}`.trim()}
      {...buttonProps}
      disabled={isLoading || disabled}
    >
      {isLoading ? loadingText || "Please wait..." : children}
    </button>
  );
}
