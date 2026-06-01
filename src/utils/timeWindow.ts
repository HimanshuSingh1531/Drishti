export interface ShiftWindow {
  id: string;
  name: string;
  nameHi: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// ─── Demo mode — current time ke aas paas shifts set hain ───
// Production mein yeh AWS se aayega
function getDemoShifts(): ShiftWindow[] {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Current time se 30 min pehle shift start
  // Current time se 2 hours baad shift end
  let startHour = currentHour;
  let startMinute = currentMinute - 30;
  if (startMinute < 0) {
    startMinute += 60;
    startHour -= 1;
  }
  if (startHour < 0) startHour = 0;

  let endHour = currentHour + 2;
  let endMinute = currentMinute;
  if (endHour >= 24) endHour = 23;

  return [
    {
      id: 'MORNING',
      name: 'Morning Shift',
      nameHi: 'सुबह की शिफ्ट',
      startHour,
      startMinute,
      endHour,
      endMinute,
    },
    {
      id: 'AFTERNOON',
      name: 'Afternoon Shift',
      nameHi: 'दोपहर की शिफ्ट',
      startHour: endHour + 1,
      startMinute: 0,
      endHour: endHour + 3,
      endMinute: 0,
    },
    {
      id: 'EVENING',
      name: 'Evening Shift',
      nameHi: 'शाम की शिफ्ट',
      startHour: endHour + 4,
      startMinute: 0,
      endHour: endHour + 6,
      endMinute: 0,
    },
  ];
}

export const SHIFTS: ShiftWindow[] = getDemoShifts();

export interface TimeCheckResult {
  allowed: boolean;
  currentShift: ShiftWindow | null;
  nextShift: ShiftWindow | null;
  currentTimeStr: string;
  minutesUntilNext: number | null;
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return toMinutes(now.getHours(), now.getMinutes());
}

export function formatShiftTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function formatMinutesLeft(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function checkTimeWindow(): TimeCheckResult {
  const now = new Date();
  const currentMins = getCurrentMinutes();
  const shifts = getDemoShifts();

  const currentTimeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  let currentShift: ShiftWindow | null = null;
  for (const shift of shifts) {
    const start = toMinutes(shift.startHour, shift.startMinute);
    const end = toMinutes(shift.endHour, shift.endMinute);
    if (currentMins >= start && currentMins <= end) {
      currentShift = shift;
      break;
    }
  }

  let nextShift: ShiftWindow | null = null;
  let minutesUntilNext: number | null = null;

  for (const shift of shifts) {
    const start = toMinutes(shift.startHour, shift.startMinute);
    if (start > currentMins) {
      nextShift = shift;
      minutesUntilNext = start - currentMins;
      break;
    }
  }

  return {
    allowed: currentShift !== null,
    currentShift,
    nextShift,
    currentTimeStr,
    minutesUntilNext,
  };
}