/**
 * strftime(3) for the preview, matching glibc's C-locale output for the
 * conversions people put in prompts.
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number, w = 2, c = '0') => String(n).padStart(w, c);

function tzAbbr(d: Date): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

function tzOffset(d: Date): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${sign}${pad(Math.floor(a / 60))}${pad(a % 60)}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((+new Date(d.getFullYear(), d.getMonth(), d.getDate()) - +start) / 86400000) + 1;
}

export function strftime(fmt: string, time: number): string {
  const d = new Date(time);
  const H = d.getHours();
  const I = H % 12 === 0 ? 12 : H % 12;
  let out = '';
  for (let i = 0; i < fmt.length; i++) {
    const ch = fmt[i];
    if (ch !== '%' || i === fmt.length - 1) {
      out += ch;
      continue;
    }
    let c = fmt[++i];
    // Skip glibc flags/modifiers we don't model (%-d, %_H, %Ey, %Od…)
    let flag = '';
    if (c === '-' || c === '_' || c === '0' || c === '^' || c === '#') {
      flag = c;
      c = fmt[++i];
    }
    if (c === 'E' || c === 'O') c = fmt[++i];
    const num = (n: number, w = 2) => (flag === '-' ? String(n) : flag === '_' ? pad(n, w, ' ') : pad(n, w));
    switch (c) {
      case 'a': out += DAYS[d.getDay()].slice(0, 3); break;
      case 'A': out += DAYS[d.getDay()]; break;
      case 'b':
      case 'h': out += MONTHS[d.getMonth()].slice(0, 3); break;
      case 'B': out += MONTHS[d.getMonth()]; break;
      case 'c': out += strftime('%a %b %e %H:%M:%S %Y', time); break;
      case 'C': out += num(Math.floor(d.getFullYear() / 100)); break;
      case 'd': out += num(d.getDate()); break;
      case 'D': out += strftime('%m/%d/%y', time); break;
      case 'e': out += flag === '-' ? String(d.getDate()) : pad(d.getDate(), 2, ' '); break;
      case 'F': out += strftime('%Y-%m-%d', time); break;
      case 'H': out += num(H); break;
      case 'I': out += num(I); break;
      case 'j': out += num(dayOfYear(d), 3); break;
      case 'k': out += pad(H, 2, ' '); break;
      case 'l': out += pad(I, 2, ' '); break;
      case 'm': out += num(d.getMonth() + 1); break;
      case 'M': out += num(d.getMinutes()); break;
      case 'n': out += '\n'; break;
      case 'p': out += H < 12 ? 'AM' : 'PM'; break;
      case 'P': out += H < 12 ? 'am' : 'pm'; break;
      case 'r': out += strftime('%I:%M:%S %p', time); break;
      case 'R': out += strftime('%H:%M', time); break;
      case 's': out += String(Math.floor(time / 1000)); break;
      case 'S': out += num(d.getSeconds()); break;
      case 't': out += '\t'; break;
      case 'T': out += strftime('%H:%M:%S', time); break;
      case 'u': out += String(d.getDay() === 0 ? 7 : d.getDay()); break;
      case 'w': out += String(d.getDay()); break;
      case 'x': out += strftime('%m/%d/%y', time); break;
      case 'X': out += strftime('%H:%M:%S', time); break;
      case 'y': out += num(d.getFullYear() % 100); break;
      case 'Y': out += String(d.getFullYear()); break;
      case 'z': out += tzOffset(d); break;
      case 'Z': out += tzAbbr(d); break;
      case '%': out += '%'; break;
      default: out += '%' + (c ?? ''); break;
    }
  }
  return out;
}
