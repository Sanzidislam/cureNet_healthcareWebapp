/** 30-min slots from 08:00 to 18:00 for chamber times */
export const CHAMBER_TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
})();

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type ChamberTimes = Partial<Record<Weekday, string[]>>;

export function emptyChamberTimes(): ChamberTimes {
  return WEEKDAYS.reduce<ChamberTimes>((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

export function normalizeChamberTimes(raw: ChamberTimes | null | undefined): ChamberTimes {
  const out = emptyChamberTimes();
  if (!raw || typeof raw !== 'object') return out;
  for (const day of WEEKDAYS) {
    const arr = raw[day];
    if (Array.isArray(arr) && arr.every((t) => typeof t === 'string')) {
      out[day] = [...arr];
    }
  }
  return out;
}
