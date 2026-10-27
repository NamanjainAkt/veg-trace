export function formatScannedAt(value: string): string {
  if (!value) return '';
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const diffMs = Date.now() - time;
  if (diffMs < 0) return value;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(time).toLocaleDateString();
}
