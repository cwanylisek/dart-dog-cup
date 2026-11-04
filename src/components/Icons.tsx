import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 22, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
)
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const TargetIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
)
export const TrophyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
    <path d="M16 6h3a3 3 0 0 1-3 4M8 6H5a3 3 0 0 0 3 4M12 13v4M8 20h8M10 17h4" />
  </svg>
)
export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </svg>
)
export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
)
export const UndoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
)
export const SwapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4v16M7 4L3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4" />
  </svg>
)
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 5l12 7-12 7V5z" fill="currentColor" />
  </svg>
)
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const CloudIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5H7z" />
  </svg>
)
export const CloudOffIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 3l18 18M8.5 6.2A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1 2 7.9M17 18H7a4.5 4.5 0 0 1-1.9-8.6" />
  </svg>
)
export const DeviceIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M11 18.5h2" />
  </svg>
)
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
)
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)
