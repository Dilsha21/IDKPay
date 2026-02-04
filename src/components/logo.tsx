import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/logo.png" // Replace with your logo filename
        alt="IDKPay Logo"
        width={width}
        height={height}
        className="object-contain"
        // Fallback to text logo if image fails to load
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<span class="font-bold text-primary">IDK</span>`;
          }
        }}
      />
    </div>
  );
}

// Text-only logo as fallback
export function TextLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold text-primary ${className}`}>
      IDKPay
    </span>
  );
}
