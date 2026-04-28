import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PrefsProvider } from "@/components/admin/prefs-provider";
import { ToastProvider } from "@/components/admin/toast-provider";
import { getPrefs } from "@/lib/prefs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aperix Admin",
  description: "Private internal dashboard for Aperix Studio operations.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const prefs = await getPrefs();
  const noFlash = `(function(){try{var t=${JSON.stringify(prefs.theme)};var d=t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={prefs.theme === "dark" ? "dark" : "light"}
      data-density={prefs.density}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <PrefsProvider initialTheme={prefs.theme} initialDensity={prefs.density}>
          <ToastProvider>{children}</ToastProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
