interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * (public) group layout
 *
 * Minimal wrapper for publicly accessible pages:
 * /about, /catalog (public course listing), /verify/:code
 *
 * Add a public marketing navbar here when the marketing site is built.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Future: <PublicNavbar /> */}
      <main>{children}</main>
      {/* Future: <Footer /> */}
    </div>
  );
}
