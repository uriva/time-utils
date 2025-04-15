import {
  datesInRange,
  dateString,
  dateToTimestamp,
  dayInMs,
  endOfDay,
  endOfYear,
  formatTime24Hour,
  hourInMs,
  humanTimeToTimestamp,
  isNightTime,
  msFromNightStart,
  nextWeekday,
  textHasDate,
  timestampToHumanTime,
  weekday,
} from "./mod.ts";

import { assertEquals } from "jsr:@std/assert";

Deno.test("conversions", () => {
  assertEquals(humanTimeToTimestamp(-5, 2023, 11, 26, 22, 8), 1701054480000);
});

Deno.test("entire time display", () => {
  assertEquals(
    timestampToHumanTime("en", 2, 1701460680000),
    "Friday, 21:58, December 1st 2023",
  );
});

Deno.test("hour display", () => {
  assertEquals(formatTime24Hour(-5, 1701460680000), "14:58");
});

Deno.test("parse in locale", () => {
  assertEquals(
    formatTime24Hour(2, dateToTimestamp(2, "2023-11-30 16:30")),
    "16:30",
  );
});

Deno.test("parse in locale", () => {
  assertEquals(
    formatTime24Hour(2, dateToTimestamp(2, "2024-03-25T18:00:00")),
    "18:00",
  );
});

Deno.test("non negative timestamp", () => {
  assertEquals(dateToTimestamp(2, "2023-12-02"), 1701468000000);
});

Deno.test("T and Z in timestamp", () => {
  assertEquals(dateToTimestamp(3, "2024-05-28T19:56:00Z"), 1716915360000);
});

Deno.test("correct timestamp", () => {
  assertEquals(dateToTimestamp(2, "2023-12-15 22:00:00"), 1702670400000);
});

Deno.test("correct timestamp in another locale", () => {
  assertEquals(dateToTimestamp(-5, "2023-12-15 15:00:00"), 1702670400000);
});

Deno.test("dates in range", () => {
  assertEquals(
    datesInRange("en", -5, {
      start: 1702670400000,
      end: 1702670400000 + 3 * dayInMs,
    }),
    ["Friday 15/12", "Saturday 16/12", "Sunday 17/12", "Monday 18/12"],
  );
  assertEquals(
    datesInRange("en", 3, { start: 1734446160000, end: 1734532560000 }),
    ["Tuesday 17/12", "Wednesday 18/12"],
  );
});

Deno.test("end of day", () => {
  const end = dateToTimestamp(7, "2023-12-15 00:00:00");
  assertEquals(endOfDay(7, end - 12890471), end);
});

Deno.test("end of year", () => {
  assertEquals(
    endOfYear(7, dateToTimestamp(7, "2023-12-22 00:00:00")),
    dateToTimestamp(7, "2024-01-01 00:00:00"),
  );
});

Deno.test("weekday", () => {
  assertEquals(weekday("en", 2, 1710799200000), "Tuesday");
  assertEquals(weekday("he", 2, 1710799200000), "שלישי");
});

Deno.test("dateString", () => {
  assertEquals(dateString(2, 1710799200000), "19/3");
  assertEquals(dateString(-5, 1710283625000), "12/3");
});

Deno.test("ms from night start", () => {
  assertEquals(
    msFromNightStart(-5, humanTimeToTimestamp(-5, 2023, 11, 26, 2, 0)),
    hourInMs * 5,
  );
});

Deno.test("night time", () => {
  assertEquals(
    isNightTime(-5, humanTimeToTimestamp(-5, 2023, 11, 26, 22, 8)),
    true,
  );
  assertEquals(
    isNightTime(-2, humanTimeToTimestamp(-2, 2023, 11, 26, 3, 2)),
    true,
  );
  assertEquals(
    isNightTime(3, humanTimeToTimestamp(3, 2023, 11, 26, 19, 8)),
    false,
  );
  assertEquals(
    isNightTime(3, humanTimeToTimestamp(3, 2023, 11, 26, 14, 8)),
    false,
  );
});

Deno.test("text has date", () =>
  [
    "Facebook Log In חיפאית בתחתית - לוח אירועי תרבות ואמנות אלטרנטיביים בחיפה | למרות הכל ובגלל הכל , · 9.9K members Join group Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook אורלי פרץ Admin  ·  · Shared with Public group למרות הכל ובגלל הכל , הגיע הזמן לנגן , לשיר , לרקוד ולחגוג את החיים, נתראה בראשון 27/10          לאסקפיזם טהור החל מהשעה 20:30. מחכים לכם בwild jam, בואו להשמיע להישמע וליצור מוזיקה דרך חטיבת גולני 8, חיפה. All reactions: 1 Like Comment Share Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Facebook Log in or sign up for Facebook to connect with friends, family and people you know. Log In or Create new account",
    `שבת שלום!
שמחים לעדכן שעונת הקריוקי של ממתוק בנולה סוקס תפתח ביום ראשון הבא, 27.10 🕺💃 ותתקיים בכל ערב ראשון מהשעה 21:00.
בנולה יש מרחב מוגן והשגחה פרטית ❤
מזכירה שבקריוקי שלנו יש רשימת שירים, מי שמעוניין בשיר מסוים יכול לשלוח לנו הודעה.
מחכים לכם עם הלב, המיקרופון והקהל האוהב ביותר.
*27.10 יום ראשון 21:00 | נולה סוקס, שלום עליכם 4 מרכז זיו, חיפה*
נתראה! 🧚`,
  ].forEach((t) => assertEquals(textHasDate(t), true)));

Deno.test("text has no date", () =>
  [`Facebook Join or Log Into Facebook Sign Up This page isn't available The link you followed may be broken, or the page may have been removed. Go back to the previous page · Go to Feed · Visit our Help Center English (US) Español Français (France) 中文(简体) العربية Português (Brasil) Italiano 한국어 Deutsch हिन्दी 日本語 Sign Up Log In Messenger Facebook Lite Video Places Games Marketplace Meta Pay Meta Store Meta Quest Ray-Ban Meta Meta AI Instagram Threads Fundraisers Services Voting Information Center Privacy Policy Consumer Health Privacy Privacy Center Groups About Create ad Create Page Developers Careers Cookies Ad choices Terms Help Contact Uploading & Non-Users Settings Activity log Meta © 2024`]
    .forEach((t) => assertEquals(textHasDate(t), false)));

Deno.test("upcoming weekday", () => {
  assertEquals(
    nextWeekday(4, 2, humanTimeToTimestamp(2, 2024, 12, 3, 12, 49)),
    humanTimeToTimestamp(2, 2024, 12, 5, 0, 0),
  );
  assertEquals(
    nextWeekday(
      0,
      2,
      humanTimeToTimestamp(2, 2024, 4, 12, 12, 18),
    ),
    humanTimeToTimestamp(2, 2024, 4, 14, 0, 0),
  );
  assertEquals(
    nextWeekday(
      0,
      2,
      humanTimeToTimestamp(2, 2024, 4, 13, 12, 18),
    ),
    humanTimeToTimestamp(2, 2024, 4, 14, 0, 0),
  );
  assertEquals(
    nextWeekday(
      4,
      2,
      humanTimeToTimestamp(2, 2023, 11, 26, 22, 45),
    ),
    humanTimeToTimestamp(2, 2023, 11, 30, 0, 0),
  );
  assertEquals(
    nextWeekday(
      0,
      2,
      humanTimeToTimestamp(2, 2023, 12, 2, 16, 40),
    ),
    humanTimeToTimestamp(2, 2023, 12, 3, 0, 0),
  );
});
