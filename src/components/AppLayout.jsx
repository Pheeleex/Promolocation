import React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assetPath } from "../utils/assetPath";

const navItems = [
  {
    key: "promoters",
    label: "Promoters List",
    path: "/promoters",
    icon: "assets/promoters.png",
  },
  {
    key: "add-promoter",
    label: "Add New Promoters",
    path: "/promoters/new",
    icon: "assets/add-personnel.png",
  },
  {
    key: "incidents",
    label: "Incident History",
    path: "/incidents",
    icon: "assets/Frame.png",
  },
];

export default function AppLayout({
  activeNav,
  mainContentClassName = "",
  children,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add("has-sidebar");

    return () => {
      document.body.classList.remove("has-sidebar");
      document.body.classList.remove("sidebar-open");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", isMobileSidebarOpen);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLogoutModalOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 600) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="page-container">
        <aside className="sidebar" id="appSidebar">
          <button
            type="button"
            className="mobile-sidebar-close"
            aria-label="Close navigation menu"
            onClick={closeMobileSidebar}
          >
            Close
          </button>
          <div className="sidebar-logo">
            <img src={assetPath("assets/auth-logo.png")} alt="Main Logo" />
          </div>

          <nav className="sidebar-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.key} className={item.key === activeNav ? "active" : ""}>
                  <Link
                    to={item.path}
                    aria-current={item.key === activeNav ? "page" : undefined}
                    onClick={closeMobileSidebar}
                  >
                    <img src={assetPath(item.icon)} alt="" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="logout-link"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <img src={assetPath("assets/Frame1.png")} alt="" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={closeMobileSidebar}
        />

        <main className={`main-content ${mainContentClassName}`.trim()}>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Open navigation menu"
            aria-controls="appSidebar"
            aria-expanded={isMobileSidebarOpen}
            onClick={() => setIsMobileSidebarOpen((current) => !current)}
          >
            <span className="mobile-nav-toggle-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="mobile-nav-toggle-text">Menu</span>
          </button>
          {children}
        </main>
      </div>

      {isLogoutModalOpen ? (
        <div
          className="logout-overlay active"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsLogoutModalOpen(false);
            }
          }}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logoutTitle"
          >
            <div className="logout-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <h2 id="logoutTitle">Log Out?</h2>
            <p>
              Are you sure you want to log out?
              <br />
              You'll need to sign in again to access the admin panel.
            </p>

            <div className="modal-divider"></div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-confirm" onClick={handleLogout}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
