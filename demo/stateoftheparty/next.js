(function (root) {
  const ZONE = "America/New_York";
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const THEME_KEY = "sotp-next-theme";
  const THEMES = Object.freeze({ light: "light", dark: "dark" });

  const SERIES = Object.freeze({
    title: "SOTP Run Club",
    place: Object.freeze({
      name: "Banneker Rec Center Track",
      address: "2500 Georgia Ave NW, Washington, DC",
    }),
    stravaUrl: "https://www.strava.com/clubs/stateoftheparty",
    zone: ZONE,
    duration: "PT1H",
    slots: Object.freeze({
      1: Object.freeze({ hour: 18, minute: 30, meetHour: 18, meetMinute: 0 }),
      4: Object.freeze({ hour: 6, minute: 30, meetHour: null, meetMinute: null }),
    }),
  });

  function ok(value) {
    return { ok: true, value: value };
  }

  function err(message) {
    return { ok: false, error: message };
  }

  function parseDuration(iso) {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
    if (!match) return null;
    return ((Number(match[1]) || 0) * 60 + (Number(match[2]) || 0)) * 60 * 1000;
  }

  function parseCivilDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const utc = new Date(Date.UTC(year, month - 1, day));
    if (
      utc.getUTCFullYear() !== year ||
      utc.getUTCMonth() !== month - 1 ||
      utc.getUTCDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day, weekday: utc.getUTCDay() };
  }

  function zonedParts(date, zone) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = {};
    fmt.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") parts[part.type] = part.value;
    });
    return parts;
  }

  // Intl can read a zone but cannot write one. Walk a UTC guess until the wall clock matches.
  function fromZonedCivil(year, month, day, hour, minute, zone) {
    var guess = Date.UTC(year, month - 1, day, hour + 4, minute, 0);
    for (var i = 0; i < 4; i++) {
      const parts = zonedParts(new Date(guess), zone);
      const got = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
      );
      const want = Date.UTC(year, month - 1, day, hour, minute, 0);
      const delta = want - got;
      if (delta === 0) return new Date(guess);
      guess += delta;
    }
    return new Date(guess);
  }

  function nonEmpty(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function parsePlace(place) {
    if (!place || !nonEmpty(place.name) || !nonEmpty(place.address)) return null;
    return { name: place.name.trim(), address: place.address.trim() };
  }

  function parse(raw) {
    if (!raw || typeof raw !== "object") {
      return err("SOTP_EVENT is missing. Set it in event.js.");
    }
    const capture = nonEmpty(raw.formspreeAction) ? raw.formspreeAction.trim() : null;

    if (raw.kind === "run-club") {
      if (!nonEmpty(raw.on)) return err("Run Club needs `on` as a YYYY-MM-DD civil date.");
      if (!nonEmpty(raw.poshUrl)) return err("Run Club needs `poshUrl`.");
      const civil = parseCivilDate(raw.on.trim());
      if (!civil) return err("`on` must be a real YYYY-MM-DD date.");
      const slot = SERIES.slots[civil.weekday];
      if (!slot) {
        return err(
          "Run Club `on` must fall on a Monday or Thursday. " +
            raw.on.trim() +
            " is a " +
            WEEKDAYS[civil.weekday] +
            "."
        );
      }
      return ok({
        kind: "run-club",
        civil: civil,
        slot: slot,
        poshUrl: raw.poshUrl.trim(),
        formspreeAction: capture,
      });
    }

    if (raw.kind === "one-off") {
      if (!nonEmpty(raw.title)) return err("One-off needs `title`.");
      if (!nonEmpty(raw.start)) return err("One-off needs `start` as an ISO datetime.");
      if (!nonEmpty(raw.poshUrl)) return err("One-off needs `poshUrl`.");
      const place = parsePlace(raw.place);
      if (!place) return err("One-off needs `place.name` and `place.address`.");
      const start = new Date(raw.start);
      if (Number.isNaN(start.getTime())) return err("One-off `start` is not a readable datetime.");
      const stravaUrl = nonEmpty(raw.stravaUrl) ? raw.stravaUrl.trim() : null;
      return ok({
        kind: "one-off",
        title: raw.title.trim(),
        start: start,
        place: place,
        poshUrl: raw.poshUrl.trim(),
        stravaUrl: stravaUrl,
        formspreeAction: capture,
      });
    }

    return err('`kind` must be "run-club" or "one-off".');
  }

  function formatWhen(date, zone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function formatTime(date, zone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function formatWhere(place) {
    return place.name + " · " + place.address;
  }

  function civilStamp(civil) {
    const month = String(civil.month).padStart(2, "0");
    const day = String(civil.day).padStart(2, "0");
    return civil.year + "-" + month + "-" + day;
  }

  function resolve(parsed) {
    const durationMs = parseDuration(SERIES.duration);
    if (durationMs == null) return err("SERIES duration is not a readable ISO duration.");

    if (parsed.kind === "run-club") {
      const civil = parsed.civil;
      const slot = parsed.slot;
      const start = fromZonedCivil(
        civil.year,
        civil.month,
        civil.day,
        slot.hour,
        slot.minute,
        SERIES.zone
      );
      const meet =
        slot.meetHour == null
          ? null
          : fromZonedCivil(
              civil.year,
              civil.month,
              civil.day,
              slot.meetHour,
              slot.meetMinute,
              SERIES.zone
            );
      const end = new Date(start.getTime() + durationMs);
      return ok({
        title: SERIES.title,
        start: start,
        end: end,
        meet: meet,
        place: SERIES.place,
        poshUrl: parsed.poshUrl,
        stravaUrl: SERIES.stravaUrl,
        zone: SERIES.zone,
        whenLabel: formatWhen(start, SERIES.zone),
        whereLabel: formatWhere(SERIES.place),
        meetLabel: meet ? "Meet at " + formatTime(meet, SERIES.zone) + "." : null,
        past: Date.now() > end.getTime(),
        formspreeAction: parsed.formspreeAction,
        icsName: "sotp-run-club-" + civilStamp(civil) + ".ics",
      });
    }

    const end = new Date(parsed.start.getTime() + durationMs);
    const startParts = zonedParts(parsed.start, ZONE);
    return ok({
      title: parsed.title,
      start: parsed.start,
      end: end,
      meet: null,
      place: parsed.place,
      poshUrl: parsed.poshUrl,
      stravaUrl: parsed.stravaUrl,
      zone: ZONE,
      whenLabel: formatWhen(parsed.start, ZONE),
      whereLabel: formatWhere(parsed.place),
      meetLabel: null,
      past: Date.now() > end.getTime(),
      formspreeAction: parsed.formspreeAction,
      icsName:
        "sotp-event-" +
        startParts.year +
        "-" +
        startParts.month +
        "-" +
        startParts.day +
        ".ics",
    });
  }

  function icsStamp(date) {
    return (
      date.getUTCFullYear() +
      String(date.getUTCMonth() + 1).padStart(2, "0") +
      String(date.getUTCDate()).padStart(2, "0") +
      "T" +
      String(date.getUTCHours()).padStart(2, "0") +
      String(date.getUTCMinutes()).padStart(2, "0") +
      String(date.getUTCSeconds()).padStart(2, "0") +
      "Z"
    );
  }

  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function icsText(occurrence) {
    const location = occurrence.place.name + ", " + occurrence.place.address;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dav//SOTP Next Up Demo//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + occurrence.icsName.replace(/\.ics$/, "") + "@sotp-next-demo",
      "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + icsStamp(occurrence.start),
      "DTEND:" + icsStamp(occurrence.end),
      "SUMMARY:" + icsEscape(occurrence.title),
      "LOCATION:" + icsEscape(location),
      "DESCRIPTION:" + icsEscape("RSVP " + occurrence.poshUrl),
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.join("\r\n") + "\r\n";
  }

  function slot(name) {
    return document.querySelector("[data-slot=\"" + name + "\"]");
  }

  function readTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === THEMES.light || stored === THEMES.dark) return stored;
    } catch (e) {
      /* private mode / blocked storage */
    }
    return THEMES.light;
  }

  function paintThemeToggle(theme) {
    const btn = slot("theme-toggle");
    if (!btn) return;
    // Setting-oriented toggle: stable name + aria-pressed for current dark state.
    btn.textContent = "Dark";
    btn.setAttribute("aria-label", "Dark mode");
    btn.setAttribute("aria-pressed", theme === THEMES.dark ? "true" : "false");
  }

  function applyTheme(theme) {
    const next = theme === THEMES.dark ? THEMES.dark : THEMES.light;
    if (root.document && root.document.documentElement) {
      root.document.documentElement.setAttribute("data-theme", next);
    }
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* ignore write failures; attribute still applies for this load */
    }
    paintThemeToggle(next);
    return next;
  }

  function wireTheme() {
    const btn = slot("theme-toggle");
    if (!btn) return;
    applyTheme(readTheme());
    btn.addEventListener("click", function () {
      const cur =
        root.document.documentElement.getAttribute("data-theme") === THEMES.dark
          ? THEMES.dark
          : THEMES.light;
      applyTheme(cur === THEMES.light ? THEMES.dark : THEMES.light);
    });
  }

  function setText(name, text) {
    const node = slot(name);
    if (node) node.textContent = text;
  }

  function paintError(message) {
    const eventHost = slot("event");
    const errorHost = slot("error");
    const captureHost = slot("capture");
    if (eventHost) eventHost.hidden = true;
    if (captureHost) captureHost.hidden = true;
    if (errorHost) {
      errorHost.hidden = false;
      errorHost.textContent = message;
    }
  }

  function paint(occurrence) {
    const eventHost = slot("event");
    const errorHost = slot("error");
    if (eventHost) eventHost.hidden = false;
    if (errorHost) {
      errorHost.hidden = true;
      errorHost.textContent = "";
    }

    setText("title", occurrence.title);
    setText("when", occurrence.whenLabel);
    setText("where", occurrence.whereLabel);

    const note = slot("note");
    if (note) {
      if (occurrence.meetLabel) {
        note.hidden = false;
        note.textContent = occurrence.meetLabel;
      } else {
        note.hidden = true;
        note.textContent = "";
      }
    }

    const posh = slot("posh");
    if (posh) {
      posh.href = occurrence.poshUrl;
      posh.textContent = occurrence.past ? "That one's done…" : "RSVP on Posh";
    }

    const strava = slot("strava");
    if (strava) {
      if (occurrence.stravaUrl) {
        strava.hidden = false;
        strava.href = occurrence.stravaUrl;
      } else {
        strava.hidden = true;
        strava.removeAttribute("href");
      }
    }

    const icsLink = slot("ics");
    if (icsLink) {
      icsLink.href = "#";
      icsLink.onclick = function (event) {
        event.preventDefault();
        const blob = new Blob([icsText(occurrence)], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = occurrence.icsName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        // iOS Safari can drop the download if the blob URL dies in the same turn.
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 2000);
      };
    }

    const captureHost = slot("capture");
    const captureForm = slot("capture-form");
    if (occurrence.formspreeAction && captureHost && captureForm) {
      captureForm.action = occurrence.formspreeAction;
      captureHost.hidden = false;
    } else if (captureHost) {
      captureHost.hidden = true;
    }
  }

  // Classic-script `const` is a global lexical binding, not window.SOTP_EVENT.
  function readConfig() {
    if (typeof SOTP_EVENT !== "undefined") return SOTP_EVENT;
    return root.SOTP_EVENT;
  }

  function boot() {
    wireTheme();
    const parsed = parse(readConfig());
    if (!parsed.ok) {
      paintError(parsed.error);
      return;
    }
    const occurrence = resolve(parsed.value);
    if (!occurrence.ok) {
      paintError(occurrence.error);
      return;
    }
    paint(occurrence.value);
  }

  root.SOTP_NEXT = {
    SERIES: SERIES,
    THEME_KEY: THEME_KEY,
    parse: parse,
    resolve: resolve,
    icsText: icsText,
    readTheme: readTheme,
    applyTheme: applyTheme,
    boot: boot,
  };

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
