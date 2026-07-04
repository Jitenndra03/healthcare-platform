const colours = {
  Low:    'bg-green-50 text-green-800 ring-green-100',
  Medium: 'bg-amber-50 text-amber-800 ring-amber-100',
  High:   'bg-red-50 text-red-800 ring-red-100',
};

const dotColours = {
  Low: 'bg-green-500',
  Medium: 'bg-amber-500',
  High: 'bg-red-500 animate-pulse',
};

export default function UrgencyBadge({ urgency }: { urgency: 'Low' | 'Medium' | 'High' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${colours[urgency]}`}>
      <span className={`h-2 w-2 rounded-full ${dotColours[urgency]}`} />
      {urgency} Urgency
    </span>
  );
}
