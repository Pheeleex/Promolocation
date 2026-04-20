import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useForgotPassword } from "../hooks/use-admin-auth";
import { useForgotPasswordCooldown } from "../hooks/use-forgot-password-cooldown";
import { usePasswordAttemptLimit } from "../hooks/use-password-attempt-limit";
import { isAdminUser } from "../utils/authAccess";
import { assetPath } from "../utils/assetPath";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { authUser } = useAuth();
  const { mutateAsync: sendForgotPassword, isPending } = useForgotPassword();
  const {
    cooldownLabel,
    isCooldownActive,
    startCooldown,
  } = useForgotPasswordCooldown();
  const {
    helperText,
    isLimited,
    registerAttempt,
    waitTimeLabel,
  } = usePasswordAttemptLimit("forgot-password");
  const navigate = useNavigate();
  const apiToken = (import.meta.env.VITE_API_TOKEN ?? "").trim();

  useEffect(() => {
    if (authUser && isAdminUser(authUser)) {
      navigate("/settings", { replace: true });
    }
  }, [authUser, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Email is required.");
      return;
    }

    if (isCooldownActive) {
      await Swal.fire({
        icon: "info",
        title: "Please Wait",
        text: `You can request another reset email in ${cooldownLabel}.`,
        confirmButtonColor: "#0E2B63",
      });
      return;
    }

    if (isLimited) {
      await Swal.fire({
        icon: "warning",
        title: "Try Again Later",
        text: `You have reached the forgot password limit. Try again in ${waitTimeLabel}.`,
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      await sendForgotPassword({
        token: apiToken,
        email: normalizedEmail,
      });

      startCooldown();
      registerAttempt();
      setSubmittedEmail(normalizedEmail);
      setEmail(normalizedEmail);
      setEmailError("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to Send Reset Instructions",
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

        <h1>Forgot Password</h1>
        <p className="auth-page-copy">
          Enter the email linked to your dashboard account. If the account exists, a
          reset code will be sent there.
        </p>
        {isCooldownActive ? (
          <div className="attempt-limit-note">
            Forgot password cooldown active. You can request another reset email in{" "}
            {cooldownLabel}.
          </div>
        ) : null}
        <div className={`attempt-limit-note${isLimited ? " is-blocked" : ""}`}>
          {helperText}
        </div>

        {submittedEmail ? (
          <div className="auth-success-panel">
            <p className="auth-success-title">Check your email</p>
            <p className="auth-success-copy">
              If <strong>{submittedEmail}</strong> belongs to a dashboard account, the
              reset instructions are on the way.
            </p>
            <div className="auth-success-actions">
              <Link
                to={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
                className="auth-primary-link"
              >
                Enter Reset Code
              </Link>
            </div>
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="forgot-email">
              Email Address <span className="required-mark">*</span>
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              disabled={isPending}
              autoComplete="email"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              className={emailError ? "input-error" : ""}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
                setSubmittedEmail("");
              }}
            />
            {emailError ? (
              <p id="forgot-email-error" className="field-error" role="alert">
                {emailError}
              </p>
            ) : (
              <p className="field-helper">
                Use the same email address you sign in with on this dashboard.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isPending || isLimited || isCooldownActive}
          >
            {isPending
              ? "Sending..."
              : isCooldownActive
                ? `Wait ${cooldownLabel}`
              : isLimited
                ? `Try Again in ${waitTimeLabel}`
              : submittedEmail
                ? "Resend Instructions"
                : "Send Reset Instructions"}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/reset-password" className="auth-secondary-link">
            Already have a code? Reset password
          </Link>
          <Link to="/login" className="auth-secondary-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
