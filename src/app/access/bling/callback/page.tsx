'use client';

import { useSearchParams } from 'next/navigation';

export default function BlingCallback() {
  const params = useSearchParams();

  const code = params.get('code');

  console.log(code);
}
