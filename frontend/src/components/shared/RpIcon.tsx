import React from 'react';

interface RpIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  imgSrc?: string;
}

export const RpIcon: React.FC<RpIconProps> = ({ size = 24, className = '', imgSrc, ...props }) => {
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt="Rupiah Icon"
        style={{ width: size, height: size }}
        className={`object-contain flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide-icon ${className}`}
      {...props}
    >
      {/* Visual representation of "Rp" inside the vector box */}
      <path d="M4 6h4a3 3 0 0 1 0 6H4v6" />
      <path d="M4 12h3" />
      <path d="M12 10v8" />
      <path d="M12 13h3a2.5 2.5 0 0 0 0-5h-3" />
    </svg>
  );
};
