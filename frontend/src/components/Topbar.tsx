"use client";

import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/datasets": "Datasets",
  "/documents": "Documents",
  "/retrieval": "Retrieval",
  "/rag": "Playground",
  "/evaluation": "Cases",
  "/benchmarks": "Benchmarks",
  "/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();

  const currentPage =
    pageNames[pathname] ||
    Object.entries(pageNames).find(
      ([path]) =>
        path !== "/" && pathname.startsWith(`${path}/`)
    )?.[1] ||
    "Dashboard";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{currentPage}</strong>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button"
          aria-label="Notifications"
        >
          <span className="notification-dot" />
          <span className="notification-symbol">◦</span>
        </button>

        <div className="profile">
          <div className="profile-avatar">R</div>

          <div className="profile-info">
            <span>Ruchishya</span>
            <small>Developer</small>
          </div>
        </div>
      </div>
    </header>
  );
}