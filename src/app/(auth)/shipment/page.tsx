'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { ShipmentsGrid } from '@/modules/shipment/components/shipments-grid';

const ACCOUNT_ID = 'f0e773e8-2918-41ff-a1ad-16afe52a4a6b';
type ShipmentResponse =
  | Record<string, unknown>
  | Record<string, unknown>[]
  | { data?: Record<string, unknown> | Record<string, unknown>[] };

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
    return Array.isArray(data) ? data : [data];
  }

  return [payload];
};

export default function ShipmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') ?? '';
  const initialInvoiceCode = searchParams.get('invoiceCode') ?? '';
  const initialExternalId = searchParams.get('externalId') ?? '';

  const [shipments, setShipments] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
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

  const shouldApplyTextFilter = (value: string) => value.length > 3;

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
    const params = new URLSearchParams(searchParams.toString());

    if (shouldApplyTextFilter(normalizedStatusFilter)) {
      params.set('status', normalizedStatusFilter);
    } else {
      params.delete('status');
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
    pathname,
    router,
    searchParams,
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
        const params = new URLSearchParams();

        if (activeStatus) {
          params.set('status', activeStatus);
        }
        if (activeInvoiceCode) {
          params.set('invoiceCode', activeInvoiceCode);
        }
        if (activeExternalId) {
          params.set('externalId', activeExternalId);
        }

        const queryString = params.toString();
        const endpoint = queryString
          ? `/accounts/${ACCOUNT_ID}/shipments?${queryString}`
          : `/accounts/${ACCOUNT_ID}/shipments`;
        const response = await apiClient.get(endpoint);

        if (!isMounted) return;

        setShipments(normalizeShipments(response.data as ShipmentResponse));
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(
          axiosError.response?.data?.message || 'Failed to load shipments.',
        );
      } finally {
        if (!isMounted) return;
      }
    };

    fetchShipments();

    return () => {
      isMounted = false;
    };
  }, [
    normalizedExternalIdFilter,
    normalizedInvoiceCodeFilter,
    normalizedStatusFilter,
  ]);

  return (
    <Container className="py-5">
      <Card className="p-2">
        <h1 className="text-center text-2xl font-bold">Pedidos e fretes</h1>
        <div className="mt-6 flex items-end gap-4 overflow-x-auto">
          <div className="min-w-60 flex-1 space-y-2">
            <p className="text-sm font-medium">#Pedido</p>
            <Input
              placeholder="Type at least 4 characters"
              value={externalIdFilter}
              onChange={event => setExternalIdFilter(event.target.value)}
            />
          </div>
          <div className="min-w-60 flex-1 space-y-2">
            <p className="text-sm font-medium">Invoice Code</p>
            <Input
              placeholder="Type at least 4 characters"
              value={invoiceCodeFilter}
              onChange={event => setInvoiceCodeFilter(event.target.value)}
            />
          </div>
          <div className="min-w-60 flex-1 space-y-2">
            <p className="text-sm font-medium">Status</p>
            <Input
              placeholder="Filter by status"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <ShipmentsGrid shipments={shipments} />
      </Card>
    </Container>
  );
}
