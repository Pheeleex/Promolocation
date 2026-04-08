import React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useLogin } from "../hooks/useLogin";
import { isAdminUser } from "../utils/authAccess";
import { assetPath } from "../utils/assetPath";

function getLoginErrorMessage(status) {
  switch (status) {
    case 400:
      return "Invalid credentials.";
    case 401:
      return "Invalid API token.";
    case 403:
      return "Email not verified.";
    case 404:
      return "No account found with that promoter ID.";
    case 406:
      return "Account pending admin approval.";
    case 423:
      return "Account has been deactivated.";
    case 451:
      return "Only admin users can sign in to this dashboard.";
    default:
      return "Something went wrong.";
  }
}

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({
    userId: "",
    password: "",
  });
  const { authUser, logout } = useAuth();
  const { mutateAsync: loginUser, isPending } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const apiToken = (import.meta.env.VITE_API_TOKEN ?? "").trim();
  const redirectPath = location.state?.from?.pathname || "/promoters";

  useEffect(() => {
    if (!authUser) {
      return;
    }

    if (!isAdminUser(authUser)) {
      logout();
      return;
    }

    if (authUser) {
      navigate(redirectPath, { replace: true });
    }
  }, [authUser, logout, navigate, redirectPath]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedUserId = userId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUserId || !trimmedPassword) {
      setErrors({
        userId: trimmedUserId ? "" : "User ID is required.",
        password: trimmedPassword ? "" : "Password is required.",
      });
      return;
    }

    try {
      await loginUser({
        token: apiToken,
        promoter_id: trimmedUserId,
        password: trimmedPassword,
      });

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setPassword("");
      setIsPasswordVisible(false);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: getLoginErrorMessage(error?.status),
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-wrapper">
          <img
            src={assetPath("assets/auth-logo.png")}
            alt="Logo"
            className="logo"
          />
        </div>

        <h1>Admin Login</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="userid">Enter Your User ID</label>
            <input
              id="userid"
              type="text"
              placeholder="User ID..."
              value={userId}
              disabled={isPending}
              aria-invalid={Boolean(errors.userId)}
              aria-describedby={errors.userId ? "userid-error" : undefined}
              className={errors.userId ? "input-error" : ""}
              onChange={(event) => {
                setUserId(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  userId: "",
                }));
              }}
            />
            {errors.userId ? (
              <p id="userid-error" className="field-error" role="alert">
                {errors.userId}
              </p>
            ) : null}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div
              className={`password-input-wrapper${password ? " has-toggle" : ""}`}
            >
              <input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password...."
                value={password}
                disabled={isPending}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={errors.password ? "input-error" : ""}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    password: "",
                  }));
                }}
              />
              {password ? (
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  disabled={isPending}
                  onClick={() =>
                    setIsPasswordVisible((currentValue) => !currentValue)
                  }
                >
                  {isPasswordVisible ? "Hide" : "Show"}
                </button>
              ) : null}
            </div>
            {errors.password ? (
              <p id="password-error" className="field-error" role="alert">
                {errors.password}
              </p>
            ) : null}
          </div>

          <button type="submit" className="login-btn" disabled={isPending}>
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
