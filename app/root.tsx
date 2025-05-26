import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import styles from "./tailwind.css?url"
import { ThemeProvider } from "./components/theme-provider";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

// Das Skript, das den Flash verhindert
const noFlashScript = `
  (function() {
    function applyTheme(themeValue) {
      const cl = document.documentElement.classList;
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

      cl.remove('light', 'dark');

      if (themeValue === 'light' || (themeValue === 'system' && prefersLight)) {
        cl.add('light');
      }
    }

    let theme = 'system';
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        theme = storedTheme;
      }
    } catch (e) {
      console.warn('Could not access localStorage for theme preference.');
    }
    applyTheme(theme);
  })();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <Links />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
        {children}
        <ScrollRestoration />
        <Scripts />
      </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
