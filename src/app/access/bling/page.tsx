'use client';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BlingPage() {
  const params = useSearchParams();
  const blingOAuthUrl = params.get('blingOAuthUrl');

  if (!blingOAuthUrl) {
    return (
      <Container className="py-5">
        <h1 className="text-center text-2xl font-bold">Bling</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          Bling URL was not found
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="text-center text-2xl font-bold">Bling</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={blingOAuthUrl}>
          <Button size="sm">Request code</Button>
        </Link>
      </div>
    </Container>
  );
}
