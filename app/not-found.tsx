import Link from "next/link";

export default function NotFound() {
  return (
    <main className="main" style={{ maxWidth: 840, margin: "0 auto", paddingTop: 80 }}>
      <div className="panel section">
        <p className="kicker">Aperix Admin</p>
        <h2 style={{ margin: 0, fontSize: 40, letterSpacing: "-0.05em" }}>Project not found</h2>
        <p className="section-copy" style={{ marginTop: 12 }}>
          The requested admin view does not exist yet or the project record has been removed.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/">
            Back to dashboard
          </Link>
          <Link className="btn" href="/repos">
            Open repo view
          </Link>
        </div>
      </div>
    </main>
  );
}
