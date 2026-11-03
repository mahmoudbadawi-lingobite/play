// Small stroke icons for the Game Library card actions.
// They only show in the Kid theme (see .kid-sc-ico in kid-skin.css).

type P = { className?: string };
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const FlagIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" fill="currentColor" fillOpacity=".25" />
  </svg>
);

export const EditIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" fill="currentColor" fillOpacity=".25" />
    <path d="M14.5 6.5l3 3" />
  </svg>
);

export const TrashIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M10 3h4M6 7l1 13h10l1-13" fill="currentColor" fillOpacity=".25" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const LinkIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" />
  </svg>
);

export const CheckIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
