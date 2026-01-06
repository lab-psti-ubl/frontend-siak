// Data URI for a simple user profile icon used as a fallback avatar.
// Using an inline SVG avoids external network calls and works in Canvas as well.
export const DEFAULT_PROFILE_ICON =
  'data:image/svg+xml;utf8,' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">' +
  '<circle cx="32" cy="32" r="32" fill="%23E5E7EB"/>' +
  '<circle cx="32" cy="24" r="14" fill="%239CA3AF"/>' +
  '<path d="M16 54c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="%239CA3AF"/>' +
  '</svg>';

