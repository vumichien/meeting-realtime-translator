import React from 'react';

type RealMouseCursorProps = {
  clicked: boolean;
};

export const RealMouseCursor: React.FC<RealMouseCursorProps> = ({clicked}) => (
  <svg
    aria-hidden="true"
    height="34"
    style={{
      display: 'block',
      filter: 'drop-shadow(0 2px 3px rgba(15, 23, 42, 0.28))',
      transform: clicked ? 'scale(0.9)' : 'scale(1)',
      transformOrigin: '2px 2px',
    }}
    viewBox="0 0 34 34"
    width="34"
  >
    <path
      d="M3 3 3.3 28.2 11.1 20.5 16.2 31.1 21.3 28.7 16.2 18.4 27.9 18.1 3 3Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeLinejoin="round"
      strokeWidth="2.4"
    />
    <path
      d="M7.1 7.8 7.2 18.6 10.6 15.2 13.7 21.9 15.9 20.9 12.8 14.4 18 14.2 7.1 7.8Z"
      fill="#ffffff"
      opacity="0.7"
    />
  </svg>
);
