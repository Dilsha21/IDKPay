import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span>© 2026 IDKPay</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>A student-built project for boarding students</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Because nobody remembers who paid</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
