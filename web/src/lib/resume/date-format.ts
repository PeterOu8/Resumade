const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function formatResumeDate(value: string | null | undefined) {
  const date = value?.trim() ?? '';
  const yearFirst = /^((?:19|20)\d{2})[-/](0?[1-9]|1[0-2])$/.exec(date);
  const monthFirst = /^(0?[1-9]|1[0-2])[-/]((?:19|20)\d{2})$/.exec(date);
  if (!yearFirst && !monthFirst) return date;

  const month = Number.parseInt(yearFirst?.[2] ?? monthFirst![1], 10);
  const year = yearFirst?.[1] ?? monthFirst![2];
  return `${monthNames[month - 1]} ${year}`;
}
