"use client";

import { useState } from "react";

export function KeyboardHelp({ firstClientId }: { firstClientId?: string }) {
  const [open, setOpen] = useState(false);
  const client = firstClientId ?? "rhinos";
  return (
    <>
      <button
        type="button"
        className="topbar-icon-btn"
        title="Keyboard shortcuts (?)"
        aria-label="Keyboard shortcuts"
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {open ? (
        <div className="palette-scrim" onClick={() => setOpen(false)}>
          <div className="palette palette-help" onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard shortcuts</h3>
            <table className="kb-table">
              <tbody>
                <tr><td><kbd>⌘ K</kbd> / <kbd>Ctrl K</kbd></td><td>Command palette</td></tr>
                <tr><td><kbd>g</kbd> <kbd>d</kbd></td><td>Command Center</td></tr>
                <tr><td><kbd>g</kbd> <kbd>c</kbd></td><td>First client ({client})</td></tr>
                <tr><td><kbd>g</kbd> <kbd>n</kbd></td><td>Notifications</td></tr>
                <tr><td><kbd>g</kbd> <kbd>t</kbd></td><td>Timeline</td></tr>
                <tr><td><kbd>g</kbd> <kbd>m</kbd></td><td>Metrics</td></tr>
                <tr><td><kbd>g</kbd> <kbd>a</kbd></td><td>AI Query</td></tr>
                <tr><td><kbd>g</kbd> <kbd>s</kbd></td><td>Settings</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>Close palette / dialogs</td></tr>
              </tbody>
            </table>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
