import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <Container className="mt-12 pb-12">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Accounts first
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Manage users, profiles, and access with clarity.
          </h1>
          <p className="text-lg text-muted-foreground">
            A clean foundation for authentication, profile management, and
            admin user oversight. Keep your account flows focused and fast.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">What is ready</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Sign in and registration flows</li>
            <li>Profile updates with password changes</li>
            <li>Admin user list with role badges</li>
          </ul>
        </Card>
      </div>
    </Container>
  );
}
