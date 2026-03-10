'use client';

import { Suspense, use, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

const CONSOLIDATED_STATUS_OPTIONS = [
  { value: 'delayed', label: 'Atrasado' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'returning', label: 'Em devolução' },
  { value: 'in transit', label: 'Em trânsito' },
] as const;
import { ShipmentsGrid } from '@/modules/shipment/components/shipments-grid';

const PAGE_SIZE = 10;
type ShipmentResponse =
  | Record<string, unknown>
  | Record<string, unknown>[]
  | { data?: Record<string, unknown> | Record<string, unknown>[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeShipments = (
  payload: ShipmentResponse | null,
): Record<string, unknown>[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if ('data' in payload) {
    const data = payload.data;
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.filter(isRecord);
    }
    return isRecord(data) ? [data] : [];
  }

  return [payload];
};

function ShipmentPageContent({ accountId }: { accountId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') ?? '';
  const initialConsolidatedStatus = searchParams.get('consolidatedStatus') ?? '';
  const initialInvoiceCode = searchParams.get('invoiceCode') ?? '';
  const initialExternalId = searchParams.get('externalId') ?? '';
  const initialPage = Math.max(Number(searchParams.get('page')) || 1, 1);

  const [accountName, setAccountName] = useState<string | null>(null);
  const [shipments, setShipments] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [consolidatedStatusFilter, setConsolidatedStatusFilter] = useState(initialConsolidatedStatus);
  const [invoiceCodeFilter, setInvoiceCodeFilter] =
    useState(initialInvoiceCode);
  const [externalIdFilter, setExternalIdFilter] = useState(initialExternalId);
  const [debouncedInvoiceCode, setDebouncedInvoiceCode] =
    useState(initialInvoiceCode);
  const [debouncedExternalId, setDebouncedExternalId] =
    useState(initialExternalId);

  const normalizedStatusFilter = useMemo(
    () => statusFilter.trim(),
    [statusFilter],
  );
  const normalizedInvoiceCodeFilter = useMemo(
    () => debouncedInvoiceCode.trim(),
    [debouncedInvoiceCode],
  );
  const normalizedExternalIdFilter = useMemo(
    () => debouncedExternalId.trim(),
    [debouncedExternalId],
  );

  const shouldApplyTextFilter = (value: string) => value.length > 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedInvoiceCode(invoiceCodeFilter);
    }, 400);

    return () => clearTimeout(timeout);
  }, [invoiceCodeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedExternalId(externalIdFilter);
    }, 400);

    return () => clearTimeout(timeout);
  }, [externalIdFilter]);

  useEffect(() => {
    apiClient
      .get<{ name?: string }>(`/accounts/${accountId}`)
      .then(res => setAccountName(res.data?.name ?? null))
      .catch(() => setAccountName(null));
  }, [accountId]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (shouldApplyTextFilter(normalizedStatusFilter)) {
      params.set('status', normalizedStatusFilter);
    } else {
      params.delete('status');
    }

    if (consolidatedStatusFilter) {
      params.set('consolidatedStatus', consolidatedStatusFilter);
    } else {
      params.delete('consolidatedStatus');
    }

    if (shouldApplyTextFilter(normalizedInvoiceCodeFilter)) {
      params.set('invoiceCode', normalizedInvoiceCodeFilter);
    } else {
      params.delete('invoiceCode');
    }

    if (shouldApplyTextFilter(normalizedExternalIdFilter)) {
      params.set('externalId', normalizedExternalIdFilter);
    } else {
      params.delete('externalId');
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    } else {
      params.delete('page');
    }

    const next = params.toString();
    const current = searchParams.toString();

    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
  }, [
    normalizedExternalIdFilter,
    normalizedInvoiceCodeFilter,
    normalizedStatusFilter,
    consolidatedStatusFilter,
    pathname,
    router,
    searchParams,
    currentPage,
  ]);

  useEffect(() => {
    let isMounted = true;

    const activeStatus = shouldApplyTextFilter(normalizedStatusFilter)
      ? normalizedStatusFilter
      : '';
    const activeInvoiceCode = shouldApplyTextFilter(normalizedInvoiceCodeFilter)
      ? normalizedInvoiceCodeFilter
      : '';
    const activeExternalId = shouldApplyTextFilter(normalizedExternalIdFilter)
      ? normalizedExternalIdFilter
      : '';

    const fetchShipments = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        if (activeStatus) {
          params.set('status', activeStatus);
        }
        if (consolidatedStatusFilter) {
          params.set('consolidatedStatus', consolidatedStatusFilter);
        }
        if (activeInvoiceCode) {
          params.set('invoiceCode', activeInvoiceCode);
        }
        if (activeExternalId) {
          params.set('externalId', activeExternalId);
        }
        params.set('page', String(currentPage));
        params.set('totalItems', String(PAGE_SIZE));

        const queryString = params.toString();
        const endpoint = queryString
          ? `/accounts/${accountId}/shipments?${queryString}`
          : `/accounts/${accountId}/shipments`;
        const response = await apiClient.get(endpoint);

        if (!isMounted) return;

        const normalized = normalizeShipments(response.data as ShipmentResponse);
        if (!normalized.length && currentPage > 1) {
          setHasNextPage(false);
          setCurrentPage(page => Math.max(1, page - 1));
          return;
        }

        setShipments(normalized);
        setHasNextPage(normalized.length === PAGE_SIZE);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(
          axiosError.response?.data?.message || 'Failed to load shipments.',
        );
        setHasNextPage(false);
        setShipments([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchShipments();

    return () => {
      isMounted = false;
    };
  }, [
    accountId,
    normalizedExternalIdFilter,
    normalizedInvoiceCodeFilter,
    normalizedStatusFilter,
    consolidatedStatusFilter,
    currentPage,
  ]);

  return (
    <Container className="py-5">
      <h1 className="text-center text-2xl font-bold">
        Pedidos e Fretes{accountName ? ` - ${accountName}` : ''}
      </h1>
      <div className="mt-6 flex items-end gap-4 overflow-x-auto">
        <div className="min-w-60 flex-1 space-y-2">
          <p className="text-sm font-medium">#Pedido</p>
          <Input
            placeholder="Type to filter"
            value={externalIdFilter}
            onChange={event => {
              setExternalIdFilter(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <p className="text-sm font-medium">NFe</p>
          <Input
            placeholder="Type to filter"
            value={invoiceCodeFilter}
            onChange={event => {
              setInvoiceCodeFilter(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <p className="text-sm font-medium">Status</p>
          <Input
            placeholder="Filter by status"
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <p className="text-sm font-medium">Status Consolidado</p>
          <Select
            value={consolidatedStatusFilter || 'all'}
            onValueChange={value => {
              setConsolidatedStatusFilter(value === 'all' ? '' : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {CONSOLIDATED_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mt-2">
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <ShipmentsGrid
          accountId={accountId}
          shipments={shipments}
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </Card>
    </Container>
  );
}

export default function ShipmentPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <Container className="py-5">
          <h1 className="text-center text-2xl font-bold">Pedidos e Fretes</h1>
        </Container>
      }
    >
      <ShipmentPageContent accountId={resolvedParams.accountId} />
    </Suspense>
  );
}
