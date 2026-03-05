'use client';

import { Suspense, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Container } from '@/components/ui/container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import type { AccountResponseDto } from '@/types/api';

function AccountsPageContent() {
  const [accounts, setAccounts] = useState<AccountResponseDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/accounts');

        if (!isMounted) return;

        const data = response.data;
        const list: AccountResponseDto[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : data?.data
              ? [data.data]
              : [];

        setAccounts(list);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(
          axiosError.response?.data?.message || 'Failed to load accounts.',
        );
        setAccounts([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container className="py-5">
      <h1 className="text-center text-2xl font-bold">Contas</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {isLoading && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      )}

      {!isLoading && !error && accounts.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No accounts found.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(account => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
              <CardDescription>@{account.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{account.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-5">
          <h1 className="text-center text-2xl font-bold">Contas</h1>
        </Container>
      }
    >
      <AccountsPageContent />
    </Suspense>
  );
}
