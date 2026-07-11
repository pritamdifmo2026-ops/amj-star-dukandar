/**
 * Time-of-day greeting based on IST (UTC+5:30), independent of the viewer's
 * local timezone. Shared by the supplier and admin dashboards.
 *
 *   IST 4:00 AM – 11:59 AM → "Good morning"
 *   IST 12:00 PM – 4:59 PM → "Good afternoon"
 *   otherwise (5 PM – 3:59 AM) → "Good day to you"
 */
export function getGreeting(): string {
  const now = new Date();
  let istHours = now.getUTCHours() + 5;
  let istMinutes = now.getUTCMinutes() + 30;
  if (istMinutes >= 60) {
    istHours += 1;
    istMinutes -= 60;
  }
  istHours = istHours % 24;

  if (istHours >= 4 && istHours < 12) {
    return 'Good morning';
  } else if (istHours >= 12 && istHours < 17) {
    return 'Good afternoon';
  } else {
    return 'Good day to you';
  }
}
