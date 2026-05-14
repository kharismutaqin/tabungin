import React, { useState } from "react";
import * as Lucide from "lucide-react";
const { Eye, EyeOff, Lock } = Lucide;
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import tabunginSvg from "../../public/favicon.svg";

const THEME_ICON_FILTER: Record<string, string> = {
  pink: "hue-rotate(0deg) saturate(1.3) brightness(1.05)",
  purple: "hue-rotate(254deg) saturate(1.2) brightness(1.0)",
  blue: "hue-rotate(208deg) saturate(1.1) brightness(1.05)",
  green: "hue-rotate(138deg) saturate(1.2) brightness(1.0)",
  orange: "hue-rotate(20deg)  saturate(1.3) brightness(1.05)",
};

interface GroupEntryProps {
  onEnter: (key: string) => void;
}

export const GroupEntry: React.FC<GroupEntryProps> = ({ onEnter }) => {
  const [groupKey, setGroupKey] = useState("");
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);

  const activeTheme = localStorage.getItem("tabungin_theme") || "pink";
  const iconFilter = THEME_ICON_FILTER[activeTheme] || THEME_ICON_FILTER.pink;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupKey.trim();
    if (trimmed.length < 4) {
      setError("Kode grup minimal 4 karakter yaa");
      return;
    }
    setError("");
    onEnter(trimmed);
  };

  return (
    <div className="entry-page">
      <div className="entry-card animate-slide-up">
        <img
          src={tabunginSvg}
          alt="Celengan"
          width={64}
          height={64}
          className="entry-logo-animated"
          style={{
            display: "block",
            objectFit: "contain",
            filter: iconFilter,
            transition: "filter 0.4s ease",
            margin: "0 auto 1.5rem",
          }}
        />

        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Tabungin</h1>
        <p
          style={{
            marginBottom: "2rem",
            color: "var(--text-muted)",
            fontSize: "0.95rem",
          }}
        >
          Pantau setiap rupiah yang terkumpul bersama.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label
              htmlFor="groupKey"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Lock size={14} color="var(--primary)" />
              Kode Grup
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="groupKey"
                type={showKey ? "text" : "password"}
                className="input"
                placeholder="Masukin kode rahasia..."
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                autoComplete="off"
                autoFocus
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? "Hide kode rahasia" : "View kode rahasia"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <span
                style={{ color: "var(--primary-hover)", fontSize: "0.875rem" }}
              >
                {error}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ fontSize: "1.05rem" }}
          >
            🚀 Masuk Sekarang
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          🔒 Privasi kamu aman. Semua data otomatis terenkripsi.
        </p>

        <footer
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            padding: "1rem 0 0",
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <a
            href="https://github.com/kharismutaqin/tabungin"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <FontAwesomeIcon icon={faGithub} />
            source code
          </a>
        </footer>
      </div>
    </div>
  );
};
