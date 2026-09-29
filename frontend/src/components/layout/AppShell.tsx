import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="app-shell">
      <Sidebar />

      <section className="content-area">
        <Topbar />

        <div className="page-content">{children}</div>
      </section>
    </main>
  );
}