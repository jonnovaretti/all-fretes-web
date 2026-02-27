'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
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
  const [shipments, setShipments] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchShipments = async () => {
      try {
        const response = await apiClient.get(
          `/accounts/${ACCOUNT_ID}/shipments`,
        );

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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchShipments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container className="py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Account Shipments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Endpoint: /account/{ACCOUNT_ID}/shipments
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {isLoading ? 'Loading shipments...' : 'Loaded'}
        </p>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <ShipmentsGrid shipments={shipments} />
      </Card>
    </Container>
  );
}
