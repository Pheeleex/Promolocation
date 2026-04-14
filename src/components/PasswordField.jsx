import React from "react";
import { useEffect, useState } from "react";

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  error = "",
  disabled = false,
  placeholder = "Password",
  autoComplete = "current-password",
  required = false,
  helperText = "",
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText && !error ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    if (!value) {
      setIsPasswordVisible(false);
    }
  }, [value]);

  return (
    <div className="input-group">
      <label htmlFor={id}>
        {label}
        {required ? <span className="required-mark">*</span> : null}
      </label>
      <div className={`password-input-wrapper${value ? " has-toggle" : ""}`}>
        <input
          id={id}
          type={isPasswordVisible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          data-1p-ignore="true"
          data-bwignore="true"
          data-lpignore="true"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={error ? "input-error" : ""}
          onChange={onChange}
        />
        {value ? (
          <button
            type="button"
            className="password-toggle-btn"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            disabled={disabled}
            onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {helperText && !error ? (
        <p id={helperId} className="field-helper">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
