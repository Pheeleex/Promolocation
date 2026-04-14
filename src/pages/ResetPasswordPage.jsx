import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useResetAdminPassword } from "../hooks/use-admin-auth";
import { isAdminUser } from "../utils/authAccess";
import { assetPath } from "../utils/assetPath";

function getInitialEmail(searchParams) {
  return searchParams.get("email")?.trim().toLowerCase() ?? "";
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const prefilledEmail = getInitialEmail(searchParams);
  const [email, setEmail] = useState(() => prefilledEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { authUser } = useAuth();
  const { mutateAsync: submitPasswordReset, isPending } = useResetAdminPassword();
  const navigate = useNavigate();
  const apiToken = (import.meta.env.VITE_API_TOKEN ?? "").trim();

  useEffect(() => {
    if (authUser && isAdminUser(authUser)) {
      navigate("/settings", { replace: true });
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const nextErrors = {
      email: normalizedEmail ? "" : "Email is required.",
      code: trimmedCode ? "" : "Reset code is required.",
      newPassword: trimmedNewPassword ? "" : "New password is required.",
      confirmPassword: trimmedConfirmPassword ? "" : "Please confirm the new password.",
    };

    if (!nextErrors.confirmPassword && trimmedNewPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      await submitPasswordReset({
        token: apiToken,
        email: normalizedEmail,
        code: trimmedCode,
        new_password: trimmedNewPassword,
        confirm_password: trimmedConfirmPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "Password Reset Successful",
        text: "You can now sign in with your new password.",
        confirmButtonColor: "#22c55e",
      });

      navigate("/login", { replace: true });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to Reset Password",
        text: error?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container auth-flow-container">
        <div className="logo-wrapper">
          <img
            src={assetPath("assets/auth-logo.png")}
            alt="Logo"
            className="logo"
          />
        </div>

        <h1>Reset Password</h1>
        <p className="auth-page-copy">
          Enter the reset code sent to your email, then choose a new password for
          your admin account.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="reset-email">
              Email Address <span className="required-mark">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              disabled={isPending}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "reset-email-error" : undefined}
              className={errors.email ? "input-error" : ""}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  email: "",
                }));
              }}
            />
            {errors.email ? (
              <p id="reset-email-error" className="field-error" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="input-group">
            <label htmlFor="reset-code">
              Reset Code <span className="required-mark">*</span>
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              placeholder="047823"
              value={code}
              disabled={isPending}
              autoComplete="one-time-code"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "reset-code-error" : undefined}
              className={errors.code ? "input-error" : ""}
              onChange={(event) => {
                setCode(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  code: "",
                }));
              }}
            />
            {errors.code ? (
              <p id="reset-code-error" className="field-error" role="alert">
                {errors.code}
              </p>
            ) : (
              <p className="field-helper">
                Use the code that was sent from the forgot-password flow.
              </p>
            )}
          </div>

          <PasswordField
            id="reset-new-password"
            label="New Password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setErrors((currentErrors) => ({
                ...currentErrors,
                newPassword: "",
              }));
            }}
            error={errors.newPassword}
            disabled={isPending}
            placeholder="New password"
            autoComplete="new-password"
            required
          />

          <PasswordField
            id="reset-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((currentErrors) => ({
                ...currentErrors,
                confirmPassword: "",
              }));
            }}
            error={errors.confirmPassword}
            disabled={isPending}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
          />

          <button type="submit" className="login-btn" disabled={isPending}>
            {isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/forgot-password" className="auth-secondary-link">
            Need a new code? Go back
          </Link>
          <Link to="/login" className="auth-secondary-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
