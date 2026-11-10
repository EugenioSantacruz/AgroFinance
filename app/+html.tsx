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
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

