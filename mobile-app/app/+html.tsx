import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * Custom HTML template untuk Expo web build.
 * Load Ionicons font dari CDN agar tidak ada error "invalid sfntVersion".
 * File ini hanya dipakai saat build web — tidak dipakai di iOS/Android.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>EduTech SMK</title>

        {/* Ionicons font dari CDN — menggantikan TTF bundled yang corrupt */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/ionicons@5.5.2/dist/css/ionicons.min.css"
        />

        {/*
         * Fix web scroll behavior — required for Expo Router web
         * Mencegah body scroll saat app sudah punya scroll sendiri
         */}
        <ScrollViewStyleReset />

        {/* App style dasar */}
        <style>{`
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            background-color: #F5F5F7;
          }
          /* Override Ionicons font source ke CDN agar tidak load TTF lokal */
          @font-face {
            font-family: 'Ionicons';
            src: url('https://unpkg.com/ionicons@5.5.2/dist/fonts/ionicons.woff2?v=5.5.2') format('woff2'),
                 url('https://unpkg.com/ionicons@5.5.2/dist/fonts/ionicons.woff?v=5.5.2') format('woff');
            font-weight: normal;
            font-style: normal;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
