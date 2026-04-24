import { parse as datetimeParse } from "jsr:@std/datetime@0.225.4";
import { HebrewCalendar } from "npm:@hebcal/core@5.9.2";
import { context } from "npm:context-inject@0.0.3";
import {
  coerce,
  concat,
  join,
  juxt,
  letIn,
  map,
  min,
  pipe,
  smaller,
  throwerCatcher,
} from "npm:gamla@118.0.0";
import { DateTime } from "npm:luxon@3.4.4";
import {
  caseInsensitive,
  simplify,
  stringToRegexp,
  wholeWord,
} from "jsr:@uri/silly-nlp@0.1.0";

export const minuteInMs = 60 * 1000;

export const hourInMs = 60 * minuteInMs;

export const dayInMs = 24 * hourInMs;

export type Tz = number | string;

const tzToString = (tz: Tz): string =>
  typeof tz === "string"
    ? tz
    : `${
      (Math.sign(tz) < 0 ? "-" : "+") +
      Math.abs(tz).toString().padStart(2, "0")
    }:00`;

export const humanTimeToTimestamp = (
  tz: Tz,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number =>
  Temporal.ZonedDateTime.from({
    timeZone: tzToString(tz),
    year,
    month,
    day,
    hour,
    minute,
  }).epochMilliseconds;

export const rangeOfNHours: (
  durationHours: number,
) => (
  tz: Tz,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) => TimeRange = (durationHours: number) =>
  pipe(humanTimeToTimestamp, makeRange(hourInMs * durationHours));

export type TimeRange = { start: number; end: number };

const temporalDate = (tz: Tz, now: number): Temporal.ZonedDateTime =>
  Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO(
    tzToString(tz),
  );

const getHours = (d: Temporal.ZonedDateTime) =>
  d.hour.toString().padStart(2, "0");

const getMinutes = (d: Temporal.ZonedDateTime) =>
  d.minute.toString().padStart(2, "0");

const monthName = (language: Language, d: Temporal.ZonedDateTime) =>
  monthNames[language][d.month - 1];

const getOrdinalSuffix = (date: number): string => {
  const lastTwoDigits = date % 100;
  return lastTwoDigits > 3 && lastTwoDigits < 21
    ? "th"
    : { 1: "st", 2: "nd", 3: "rd" }[date % 10] || "th";
};

const dateDayString = (language: Language, d: Temporal.ZonedDateTime): string =>
  language === "en" ? `${d.day}${getOrdinalSuffix(d.day)}` : `ה-${d.day}`;

export const timestampToMonthName = (
  language: Language,
  timezone: Tz,
  timestamp: number,
): string => monthName(language, temporalDate(timezone, timestamp));

const jsDateToDayOfWeek = (language: Language, d: Temporal.ZonedDateTime) =>
  weekdayNames[language][d.dayOfWeek - 1];

export const timestampToHumanTime = (
  language: Language,
  timezone: Tz,
  timestamp: number,
): string =>
  pipe(
    temporalDate,
    (d: Temporal.ZonedDateTime) =>
      `${jsDateToDayOfWeek(language, d)}, ${jsDate24Clock(d)}, ${
        monthName(language, d)
      } ${dateDayString(language, d)} ${d.year}`,
  )(timezone, timestamp);

const jsDate24Clock: (d: Temporal.ZonedDateTime) => string = pipe(
  juxt(getHours, getMinutes),
  join(":"),
);

export const formatTime24Hour: (tz: Tz, now: number) => string = pipe(
  temporalDate,
  jsDate24Clock,
);

export const dateString: (tz: Tz, now: number) => string = pipe(
  temporalDate,
  (d: Temporal.ZonedDateTime) => `${d.day}/${d.month}`,
);

export const dateStringIncludingYear: (tz: Tz, now: number) => string =
  pipe(
    temporalDate,
    (d: Temporal.ZonedDateTime) => `${d.day}/${d.month}/${d.year}`,
  );

export const weekday: (language: Language, tz: Tz, time: number) => string =
  (language: Language, tz: Tz, time: number) =>
    jsDateToDayOfWeek(language, temporalDate(tz, time));

const badTimeThrowerCatcher = throwerCatcher();

export const catchBadTimeString: ReturnType<typeof throwerCatcher>["catcher"] =
  badTimeThrowerCatcher.catcher;

const parseTimeStringHelper = (x: string) => {
  for (
    const format of [
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd HH:mm",
      "yyyy-MM-dd",
      "yyyy-MM-ddTHH:mm:ss",
    ]
  ) {
    try {
      return datetimeParse(x, format);
      // deno-lint-ignore no-empty
    } catch (_) {}
  }
  badTimeThrowerCatcher.thrower();
  throw new Error(); // for typing.
};

export const dateToTimestamp = (tz: Tz, text: string): number =>
  letIn(
    parseTimeStringHelper(text.replace(/[TZ]/g, " ").trim()),
    (d) =>
      Temporal.ZonedDateTime.from({
        timeZone: tzToString(tz),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
      }).epochMilliseconds,
  );

type Language = "en" | "he";

const weekdayNames = {
  en: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  he: [
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
    "ראשון",
  ],
};

const monthNames = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  he: [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ],
};

export const nowTimestamp: () => number = () => new Date().getTime();

export const endOfDay = (tz: Tz, timestamp: number): number =>
  temporalDate(tz, timestamp + 24 * hourInMs).startOfDay().epochMilliseconds;

export const dayStart = (tz: Tz, timestamp: number): number =>
  temporalDate(tz, timestamp).startOfDay().epochMilliseconds;

export const endOfYear = (tz: Tz, timestamp: number): number =>
  letIn(
    temporalDate(tz, timestamp),
    (current) =>
      Temporal.ZonedDateTime.from({
        timeZone: tzToString(tz),
        year: current.year + 1,
        month: 1,
        day: 1,
      }).epochMilliseconds,
  );

export const datesInRange = (
  language: Language,
  tz: Tz,
  { start, end }: TimeRange,
): string[] => {
  const result = [];
  let current = start;
  while (current < end + dayInMs) {
    result.push(`${weekday(language, tz, current)} ${dateString(tz, current)}`);
    current += dayInMs;
  }
  return result;
};

export const currentYear: (tz: Tz, now: number) => number = pipe(
  temporalDate,
  ({ year }: Temporal.ZonedDateTime) => year,
);

export const intersectTimeRanges = (
  r1: TimeRange,
  r2: TimeRange,
): TimeRange => ({
  start: Math.max(r1.start, r2.start),
  end: Math.min(r1.end, r2.end),
});

const monthAcronyms = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const textHasDate = (text: string): boolean =>
  [
    ...concat(Object.values(monthNames)),
    ...monthAcronyms,
  ]
    // "May" is ambiguous.
    .filter((x) => x.toLocaleLowerCase() !== "may")
    .map(simplify)
    .map(pipe(stringToRegexp, caseInsensitive, wholeWord))
    .some((r) => r.test(text)) || checkHasDate(text);

const checkHasDate = (input: string) =>
  [
    /\b\d{4}-\d{2}-\d{2}\b/, // YYYY-MM-DD
    /\b\d{2}-\d{2}-\d{4}\b/, // DD-MM-YYYY
    /\b\d{2}\/\d{2}\/\d{4}\b/, // MM/DD/YYYY
    /\b\d{4}\/\d{2}\/\d{2}\b/, // YYYY/MM/DD
    /\b\d{1,2}[./]\d{1,2}\b/, // without the year
  ].some((x) => x.test(input));

const timezoneInjection = context(
  (): Tz => {
    throw new Error("timezone was not provided");
  },
);

export const contextTimezone: () => Tz = timezoneInjection.access;
export const injectTimezone: (
  fn: () => Tz,
  // deno-lint-ignore no-explicit-any
) => <F extends (...xs: any[]) => any>(f: F) => F = timezoneInjection.inject;

const timestampInjection = context(
  (): number => {
    throw new Error("no time was injected");
  },
);

export const contextTimestamp: () => number = timestampInjection.access;
export const injectTimestamp: (
  fn: () => number,
  // deno-lint-ignore no-explicit-any
) => <F extends (...xs: any[]) => any>(f: F) => F = timestampInjection.inject;

const nightStart = 21 * hourInMs;

const nightEnd = 5 * hourInMs;

const nightDuration = nightEnd + hourInMs * 24 - nightStart;

export const msFromNightStart: (tz: Tz, now: number) => number = pipe(
  temporalDate,
  (x: Temporal.ZonedDateTime) =>
    x.epochMilliseconds - x.startOfDay().epochMilliseconds,
  (ms: number) =>
    ms > nightStart ? ms - nightStart : ms + (24 * hourInMs - nightStart),
);

export const isNightTime: (tz: Tz, now: number) => boolean = pipe(
  msFromNightStart,
  smaller(nightDuration),
);

export const makeRange = (duration: number) => (start: number): TimeRange => ({
  start,
  end: start + duration,
});

export const nextWeekday = (
  desiredDayOfWeek: number, // e.g. Thursday will be 4
  tz: Tz,
  timestamp: number,
): number =>
  letIn(
    temporalDate(tz, timestamp),
    ({ dayOfWeek }) => {
      return dayStart(
        tz,
        timestamp + (dayInMs * (desiredDayOfWeek >= dayOfWeek
          ? desiredDayOfWeek - dayOfWeek
          : 7 - dayOfWeek + desiredDayOfWeek)),
      );
    },
  );

export const lastWeekday = (
  desiredDayOfWeek: number, // e.g. Thursday will be 4
  tz: Tz,
  timestamp: number,
): number =>
  letIn(
    temporalDate(tz, timestamp),
    ({ dayOfWeek }) => {
      return dayStart(
        tz,
        timestamp + (dayInMs * (desiredDayOfWeek >= dayOfWeek
          ? -7 + desiredDayOfWeek - dayOfWeek
          : desiredDayOfWeek - dayOfWeek)),
      );
    },
  );

const timeOpt = (
  exclusive: boolean,
  defaultTime: string,
  year: number,
  datetime: string,
) => {
  const [date, time] = datetime.split(" ");
  const [monthStr, dayStr] = date.split("-");
  const day = Number.parseInt(dayStr);
  const month =
    monthNames.en.findIndex((m) =>
      m.toLowerCase().includes(monthStr.toLowerCase())
    ) + 1;
  if (month === 0) badTimeThrowerCatcher.thrower();
  const fixedDay = (year % 4 !== 0 && month === 2 && day === 29) ? 28 : day;
  return dateToTimestamp(
    contextTimezone(),
    `${
      [
        year,
        month.toString().padStart(2, "0"),
        fixedDay.toString().padStart(2, "0"),
      ].join("-")
    } ${time ?? defaultTime}`.trim(),
  ) + ((!time && !exclusive) ? dayInMs : 0);
};

export const parseTimeWithoutYear: (
  exclusive: boolean,
  defaultTime: string,
  datetime: string,
  relativeTo: number,
) => number = (
  exclusive: boolean,
  defaultTime: string,
  datetime: string,
  relativeTo: number,
) =>
  pipe(
    map((x: number) =>
      timeOpt(
        exclusive,
        defaultTime,
        currentYear(contextTimezone(), relativeTo) + x,
        datetime,
      )
    ),
    min((x: number) => Math.abs(x - relativeTo)),
  )([0, 1, -1]);

const jsDateToStartOfDayInMs = (date: Date): number =>
  temporalDate(contextTimezone(), date.getTime()).startOfDay()
    .epochMilliseconds;

export const israeliHoliday = (name: string, days: number): (
  tz: Tz,
  now: number,
) => TimeRange =>
  pipe(
    (_tz: Tz, now: number): Date =>
      coerce(
        HebrewCalendar.calendar({
          start: new Date(now),
          end: new Date(now + dayInMs * 400),
        }).find(({ desc }) => desc === name)?.date.greg(),
      ),
    jsDateToStartOfDayInMs,
    (start: number): TimeRange => ({
      start: start + 12 * hourInMs,
      end: endOfDay(contextTimezone(), start) + (days - 1) * dayInMs,
    }),
  );

export const ianaTimezoneOffset = (
  ianaString: string,
  nowTimestamp: number,
): number =>
  (DateTime.fromMillis(nowTimestamp, { zone: ianaString })).offset / 60;

export const localTimeToTimestamp = (iana: string, localTime: string): number =>
  (DateTime.fromISO(localTime.replace(/Z$/, ""), { zone: iana })).toUTC()
    .toMillis();

export const botReadableTime = (iana: string, time: number): string => {
  const dt = DateTime.fromMillis(time, { zone: iana });
  const day = dt.day;
  const getOrdinal = (n: number) =>
    (n > 3 && n < 21) ? "th" : (["st", "nd", "rd"][(n % 10) - 1] || "th");
  return `${dt.toFormat("cccc, HH:mm, MMMM")} ${day}${getOrdinal(day)} ${
    dt.toFormat("yyyy")
  }`;
};

export const localTimeFormat = "Local time. Format: YYYY-MM-DDTHH:mm:ss";
