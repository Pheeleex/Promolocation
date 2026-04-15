import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useChangePassword } from "../hooks/use-admin-auth";
import { usePasswordAttemptLimit } from "../hooks/use-password-attempt-limit";
import { isSpecialAdminUser } from "../utils/authAccess";

function getRoleLabel(authUser) {
  return isSpecialAdminUser(authUser) ? "Special Admin" : "Admin";
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { authUser, logout } = useAuth();
  const { mutateAsync: submitPasswordChange, isPending } = useChangePassword();
  const {
    helperText,
    isLimited,
    registerAttempt,
    waitTimeLabel,
  } = usePasswordAttemptLimit("change-password");
  const navigate = useNavigate();
  const apiToken = (import.meta.env.VITE_API_TOKEN ?? "").trim();
  const displayName =
    authUser?.fullname ||
    [authUser?.first_name, authUser?.last_name].filter(Boolean).join(" ").trim() ||
    "Admin User";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const nextErrors = {
      currentPassword: trimmedCurrentPassword ? "" : "Current password is required.",
      newPassword: trimmedNewPassword ? "" : "New password is required.",
      confirmPassword: trimmedConfirmPassword ? "" : "Please confirm the new password.",
    };

    if (
      !nextErrors.newPassword &&
      !nextErrors.currentPassword &&
      trimmedCurrentPassword === trimmedNewPassword
    ) {
      nextErrors.newPassword = "Choose a different password from the current one.";
    }

    if (!nextErrors.confirmPassword && trimmedNewPassword !== trimmedConfirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    if (isLimited) {
      await Swal.fire({
        icon: "warning",
        title: "Try Again Later",
        text: `You have reached the change password limit. Try again in ${waitTimeLabel}.`,
        confirmButtonColor: "#d33",
      });
      return;
    }

    registerAttempt();

    try {
      await submitPasswordChange({
        token: apiToken,
        current_password: trimmedCurrentPassword,
        new_password: trimmedNewPassword,
        confirm_password: trimmedConfirmPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Please sign in again with your new password.",
        confirmButtonColor: "#22c55e",
      });

      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      const isSessionError = error?.status === 401;

      await Swal.fire({
        icon: "error",
        title: isSessionError ? "Session Expired" : "Unable to Update Password",
        text:
          error?.message ||
          (isSessionError
            ? "Please sign in again and try once more."
            : "Something went wrong."),
        confirmButtonColor: "#d33",
      });

      if (isSessionError) {
        logout();
        navigate("/login", { replace: true });
      }
    }
  };

  return (
    <AppLayout activeNav="settings" mainContentClassName="settings-main">
      <div className="settings-page">
        <section className="settings-hero">
          <p className="settings-eyebrow">Account Settings</p>
          <h1>Password &amp; Security</h1>
          <p>
            Update your admin dashboard password here. After a successful change,
            you will be asked to sign in again.
          </p>
        </section>

        <section className="settings-card settings-overview-card">
          <div className="settings-card-header settings-overview-header">
            <h2>Account Summary</h2>
            <p>Your current signed-in account details.</p>
          </div>

          <div className="settings-overview-grid">
            <div className="settings-meta-item">
              <span className="settings-meta-label">Full Name</span>
              <strong>{displayName}</strong>
            </div>
            <div className="settings-meta-item">
              <span className="settings-meta-label">Role</span>
              <strong>{getRoleLabel(authUser)}</strong>
            </div>
            <div className="settings-meta-item">
              <span className="settings-meta-label">Email Address</span>
              <strong>{authUser?.email || "--"}</strong>
            </div>
          </div>
        </section>

        <section className="settings-card settings-password-card">
          <div className="settings-card-header">
            <h2>Change Password</h2>
            <p>Enter your current password, then choose the new one you want to use.</p>
          </div>
          <div className={`attempt-limit-note${isLimited ? " is-blocked" : ""}`}>
            {helperText}
          </div>

          <form className="settings-form" onSubmit={handleSubmit}>
            <PasswordField
              id="settings-current-password"
              label="Current Password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  currentPassword: "",
                }));
              }}
              error={errors.currentPassword}
              disabled={isPending}
              placeholder="Current password"
              autoComplete="current-password"
              required
            />

            <PasswordField
              id="settings-new-password"
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
              helperText="Use a password you have not used for this account before."
            />

            <PasswordField
              id="settings-confirm-password"
              label="Confirm New Password"
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

            <button
              type="submit"
              className="settings-submit-btn"
              disabled={isPending || isLimited}
            >
              {isPending
                ? "Updating Password..."
                : isLimited
                  ? `Try Again in ${waitTimeLabel}`
                  : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
