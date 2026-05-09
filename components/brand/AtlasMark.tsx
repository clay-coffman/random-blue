type AtlasMarkProps = {
  className?: string;
};

export function AtlasMark({ className }: AtlasMarkProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="15" fill="#0f1b2d" />
      <path
        d="M16 8 L25 24 L7 24 Z"
        fill="none"
        stroke="#f7f4ed"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="19"
        x2="20"
        y2="19"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
