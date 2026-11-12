import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function RootHtml({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-PY">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="AgroFinance" />
        <meta name="theme-color" content="#064E3B" />
        <title>AgroFinance PY · Bimoneda PYG / USD</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Custom sleek scrollbar for desktop browsers */
              ::-webkit-scrollbar {
                width: 7px;
                height: 7px;
              }
              ::-webkit-scrollbar-track {
                background: transparent;
              }
              ::-webkit-scrollbar-thumb {
                background: rgba(100, 130, 115, 0.35);
                border-radius: 6px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: rgba(100, 130, 115, 0.65);
              }
              body {
                font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

