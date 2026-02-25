import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { UserMenu } from './navbar/user-menu';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-xl md:text-lg">
            ALLFRETES
          </Link>

          <nav className="flex items-center gap-4 md:gap-2">
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </Container>
    </header>
  );
}
