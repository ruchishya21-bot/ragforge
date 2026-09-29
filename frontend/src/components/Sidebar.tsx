"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "grid",
      },
    ],
  },
  {
    label: "KNOWLEDGE",
    items: [
      {
        name: "Datasets",
        href: "/datasets",
        icon: "database",
      },
      {
        name: "Documents",
        href: "/documents",
        icon: "file",
      },
    ],
  },
  {
    label: "RAG SYSTEM",
    items: [
      {
        name: "Retrieval",
        href: "/retrieval",
        icon: "search",
      },
      {
        name: "Playground",
        href: "/rag",
        icon: "spark",
      },
    ],
  },
  {
    label: "EVALUATION",
    items: [
      {
        name: "Cases",
        href: "/evaluation",
        icon: "check",
      },
      {
        name: "Benchmarks",
        href: "/benchmarks",
        icon: "chart",
      },
    ],
  },
];

function Icon({
  name,
  size = 17,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
        </svg>
      );

    case "file":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h6" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4z" />
          <path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3z" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.7 2.7L16.5 9" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="m7 15 3-4 3 2 5-7" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );

    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span>R</span>
        </div>

        <div className="brand-copy">
          <span className="brand-name">RAGForge</span>
          <span className="brand-version">
            EVALUATION PLATFORM
          </span>
        </div>
      </div>

      <nav className="navigation">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>

            {section.items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <Icon name={item.icon} />

                  <span>{item.name}</span>

                  {active && <span className="active-line" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <Link
          href="/settings"
          className={`nav-item ${
            isActive("/settings") ? "active" : ""
          }`}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </Link>

        <div className="system-status">
          <div className="status-dot" />

          <div>
            <span className="status-title">System online</span>
            <span className="status-subtitle">API connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}