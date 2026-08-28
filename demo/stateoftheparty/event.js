// event.js — the only file Steven touches
// Demo data: illustrative seed from research. Not an official SOTP announcement.
// `var` (not const) so the next script can read this as a shared global.

var SOTP_EVENT = {
  kind: "run-club",
  on: "2026-08-31",
  poshUrl: "https://posh.vip/g/state-of-the-party",
  // Optional capture (null/omit = hide form):
  // formspreeAction: "https://formspree.io/f/xxxxxxxx",
};

// Flip `on` to a Monday (example 2026-08-31) for 6:30 PM, meet 6:00 PM.
// Flip `on` to a Thursday (example 2026-09-03) for 6:30 AM, no meet time.
// Any other weekday paints a config error on the page.

/* One-off shape (commented example for Steven):
var SOTP_EVENT = {
  kind: "one-off",
  title: "Yoga After Dark",
  start: "2026-08-18T19:00:00-04:00",
  place: { name: "National Mall", address: "Washington, DC" },
  poshUrl: "https://posh.vip/e/yoga-after-dark-1",
  stravaUrl: null,
};
*/
