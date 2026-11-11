import React from 'react';

export type VectorIconName =
  | 'shield'
  | 'alert'
  | 'ai'
  | 'currency'
  | 'car'
  | 'business'
  | 'space'
  | 'government'
  | 'warning'
  | 'lock'
  | 'check'
  | 'chart';

export type VectorIconSize = 'sm' | 'md' | 'lg' | number;

export const VECTOR_ICON_SIZES: Record<'sm' | 'md' | 'lg', number> = {
  sm: 24,
  md: 36,
  lg: 52,
};

export interface VectorIconProps {
  name: VectorIconName;
  size?: VectorIconSize;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const resolveIconSize = (size: VectorIconSize): number => {
  if (typeof size === 'number') {
    return size;
  }
  return VECTOR_ICON_SIZES[size];
};

const renderIconPaths = (name: VectorIconName, color: string): React.ReactNode => {
  switch (name) {
    case 'shield':
      return (
        <>
          <path d="M12 2.5L4.5 5.5V11.5C4.5 16.35 7.7 20.65 12 22C16.3 20.65 19.5 16.35 19.5 11.5V5.5L12 2.5Z" />
          <path d="M9 12.2L11 14.2L15.2 9.8" />
        </>
      );

    case 'alert':
      return (
        <>
          <path d="M18 8.5C18 5.19 15.31 2.5 12 2.5C8.69 2.5 6 5.19 6 8.5C6 14 3.5 16 3.5 16H20.5C20.5 16 18 14 18 8.5Z" />
          <path d="M10 19.2C10.45 20.15 11.17 20.75 12 20.75C12.83 20.75 13.55 20.15 14 19.2" />
          <path d="M12 1.5V2.5" />
          <path d="M3.8 5.5C3.1 6.5 2.75 7.7 2.75 9" />
          <path d="M20.2 5.5C20.9 6.5 21.25 7.7 21.25 9" />
        </>
      );

    case 'ai':
      return (
        <>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <rect x="10.25" y="10.25" width="3.5" height="3.5" rx="0.6" fill={color} stroke="none" />
          <path d="M9.5 3.5V7" />
          <path d="M14.5 3.5V7" />
          <path d="M9.5 17V20.5" />
          <path d="M14.5 17V20.5" />
          <path d="M3.5 9.5H7" />
          <path d="M3.5 14.5H7" />
          <path d="M17 9.5H20.5" />
          <path d="M17 14.5H20.5" />
        </>
      );

    case 'currency':
      return (
        <>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9 7.5H15.5" />
          <path d="M9 10.5H15.5" />
          <path d="M11.2 7.5C12.9 7.5 14 8.7 14 10.4C14 12.1 12.8 13.3 10.7 13.3H9.3L14.5 17.5" />
        </>
      );

    case 'car':
      return (
        <>
          <path d="M4.8 15H3V12C3 11.2 3.5 10.5 4.3 10.3L6.2 9.8L8.3 6.6C8.7 6 9.4 5.6 10.2 5.6H14.8C15.6 5.6 16.3 6 16.8 6.7L18.6 9.8L20.1 10.3C20.7 10.5 21 11.1 21 11.7V15H19.2" />
          <path d="M9.2 15H14.8" />
          <path d="M6.5 9.8H18.2" />
          <circle cx="7" cy="15.8" r="2.2" />
          <circle cx="17" cy="15.8" r="2.2" />
        </>
      );

    case 'business':
      return (
        <>
          <rect x="3" y="7.5" width="18" height="12.5" rx="2.2" />
          <path d="M8.5 7.5V5.5C8.5 4.4 9.4 3.5 10.5 3.5H13.5C14.6 3.5 15.5 4.4 15.5 5.5V7.5" />
          <path d="M3 12.5H21" />
          <path d="M12 11.2V13.8" />
        </>
      );

    case 'space':
      return (
        <>
          <path d="M12 2.5C14.8 5.2 16 8.6 16 12.2V15.5H8V12.2C8 8.6 9.2 5.2 12 2.5Z" />
          <path d="M8 12.5L4.5 15.5V17.5L8 15.8" />
          <path d="M16 12.5L19.5 15.5V17.5L16 15.8" />
          <circle cx="12" cy="10" r="1.8" />
          <path d="M10 18.2L12 21.5L14 18.2" />
        </>
      );

    case 'government':
      return (
        <>
          <path d="M3 8.5L12 3.5L21 8.5H3Z" />
          <path d="M5.5 8.5V17.5" />
          <path d="M9.8 8.5V17.5" />
          <path d="M14.2 8.5V17.5" />
          <path d="M18.5 8.5V17.5" />
          <path d="M3.5 17.5H20.5" />
          <path d="M2.5 20.5H21.5" />
        </>
      );

    case 'warning':
      return (
        <>
          <path d="M10.4 4.2L2.8 17.5C2.1 18.7 3 20.2 4.4 20.2H19.6C21 20.2 21.9 18.7 21.2 17.5L13.6 4.2C12.9 3 11.1 3 10.4 4.2Z" />
          <path d="M12 9.5V13.8" />
          <circle cx="12" cy="17" r="1" fill={color} stroke="none" />
        </>
      );

    case 'lock':
      return (
        <>
          <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
          <path d="M8 10.5V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10.5" />
          <circle cx="12" cy="15" r="1.2" />
          <path d="M12 16.2V17.8" />
        </>
      );

    case 'check':
      return (
        <>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M8.2 12.4L10.8 15L16 9.5" />
        </>
      );

    case 'chart':
      return (
        <>
          <path d="M3.5 19.5H20.5" />
          <rect x="4.5" y="14" width="3" height="5.5" rx="0.6" />
          <rect x="10.5" y="11" width="3" height="8.5" rx="0.6" />
          <rect x="16.5" y="7" width="3" height="12.5" rx="0.6" />
          <path d="M4.5 10.5L10.5 6.8L14.2 8.8L19.5 4" />
          <path d="M16.5 4H19.5V7" />
        </>
      );
  }
};

/**
 * Consistent deterministic inline SVG icon component across 12 editorial categories.
 */
export const VectorIcon: React.FC<VectorIconProps> = ({
  name,
  size = 'md',
  color = '#FFFFFF',
  strokeWidth = 2,
  className,
  style,
}) => {
  const px = resolveIconSize(size);

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={name}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {renderIconPaths(name, color)}
    </svg>
  );
};
