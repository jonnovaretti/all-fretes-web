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
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { AccountResponseDto } from '@/types/api';

function AccountsPageContent() {
  const [accounts, setAccounts] = useState<AccountResponseDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const handleSync = async (accountId: string, endpoint: string, label: string) => {
    const key = `${accountId}:${endpoint}`;
    try {
      setSyncing(prev => ({ ...prev, [key]: true }));
      await apiClient.post(`/accounts/${accountId}/${endpoint}`);
      toast({ title: `${label} completed successfully.` });
    } catch {
      toast({ variant: 'destructive', title: `${label} failed. Please try again.` });
    } finally {
      setSyncing(prev => ({ ...prev, [key]: false }));
    }
  };

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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/accounts/${account.id}/shipments`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  See shipments
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing[`${account.id}:sync/shipment`]}
                  onClick={() => handleSync(account.id, 'sync/shipment', 'Sync shipments')}
                >
                  {syncing[`${account.id}:sync/shipment`] ? 'Syncing...' : 'Sync shipments'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing[`${account.id}:sync/tracking`]}
                  onClick={() => handleSync(account.id, 'sync/tracking', 'Sync tracking')}
                >
                  {syncing[`${account.id}:sync/tracking`] ? 'Syncing...' : 'Sync tracking'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing[`${account.id}:sync/consolidated-status`]}
                  onClick={() => handleSync(account.id, 'sync/consolidated-status?forceAllAccounts=false', 'Consolidate status')}
                >
                  {syncing[`${account.id}:sync/consolidated-status?forceAllAccounts=false`] ? 'Syncing...' : 'Consolidate status'}
                </Button>
              </div>
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
