import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  animated?: boolean;
}

export default function Logo({ size = 32, className = '', animated = true, ...props }: LogoProps) {
  const logoSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.75)) drop-shadow(0 0 24px rgba(20, 184, 166, 0.45))',
        ...props.style,
      }}
      {...props}
    >
      {/* Outer Circular Arc */}
      <path d="M 20 38 A 38 38 0 1 0 80 38" strokeWidth="2" opacity="0.6" />

      {/* Central Trunk & Palm Branches */}
      <path d="M 50 16 L 50 32" strokeWidth="3.5" />
      <path d="M 44 14 L 50 20 L 56 14" strokeWidth="3" />
      <path d="M 38 20 L 50 32 L 62 20" strokeWidth="3" />

      {/* Outer Main Branches & Trunk */}
      <path d="M 32 30 L 40 38 L 40 60" strokeWidth="4" />
      <path d="M 68 30 L 60 38 L 60 60" strokeWidth="4" />

      {/* Horizontal Base Lines (Circuit / Water Grid) with Nodes */}
      <line x1="26" y1="62" x2="74" y2="62" strokeWidth="3.5" />
      <circle cx="26" cy="62" r="1.5" fill="currentColor" />
      <circle cx="74" cy="62" r="1.5" fill="currentColor" />

      <line x1="34" y1="70" x2="66" y2="70" strokeWidth="3" />
      <circle cx="34" cy="70" r="1.5" fill="currentColor" />
      <circle cx="66" cy="70" r="1.5" fill="currentColor" />

      <line x1="40" y1="77" x2="60" y2="77" strokeWidth="2.5" />
      <circle cx="40" cy="77" r="1.5" fill="currentColor" />
      <circle cx="60" cy="77" r="1.5" fill="currentColor" />

      <line x1="45" y1="83" x2="55" y2="83" strokeWidth="2" />
      <circle cx="45" cy="83" r="1.5" fill="currentColor" />
      <circle cx="55" cy="83" r="1.5" fill="currentColor" />
    </svg>
  );

  if (!animated) return logoSvg;

  return (
    <div
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      className="inline-flex items-center justify-center"
    >
      <motion.div
        animate={{
          rotateY: [0, 360],
        }}
        whileHover={{
          scale: 1.15,
          rotateX: 15,
        }}
        transition={{
          rotateY: {
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 0.3,
            type: 'spring',
            stiffness: 300,
          },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {logoSvg}
      </motion.div>
    </div>
  );
}
