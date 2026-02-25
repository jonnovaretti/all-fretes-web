'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const fallbackPayload = {
  externalId: '51972830',
  status: 'TRANSPORTE INICIADO',
  invoiceCode: '30',
  origin: 'SP - Santo André',
  destination: 'CE - Tauá',
  value: '238.83',
  startedAt: '2026-01-31T03:00:00.000Z',
  deliveryEstimate: '17 dias úteis',
  carrier: 'Rápido Figueiredo',
  deliveryEstimateDate: '2026-03-11T03:00:00.000Z',
  updatedAt: '2026-02-19T00:47:52.455Z',
};

type Shipment = typeof fallbackPayload;

type ShipmentResponse = Shipment | Shipment[] | { data?: Shipment | Shipment[] };

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const columns = [
  { key: 'externalId', label: 'External ID' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceCode', label: 'Invoice Code' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  { key: 'value', label: 'Value' },
  { key: 'startedAt', label: 'Started At' },
  { key: 'deliveryEstimate', label: 'Delivery Estimate' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'deliveryEstimateDate', label: 'Delivery Estimate Date' },
  { key: 'updatedAt', label: 'Updated At' },
] as const;

type ColumnKey = (typeof columns)[number]['key'];

const formatters: Partial<Record<ColumnKey, (value: Shipment[ColumnKey]) => string>> = {
  value: value => currencyFormatter.format(Number(value)),
  startedAt: value => dateFormatter.format(new Date(value)),
  deliveryEstimateDate: value => dateFormatter.format(new Date(value)),
  updatedAt: value => dateFormatter.format(new Date(value)),
};

function formatValue<K extends ColumnKey>(key: K, value: Shipment[K]) {
  const formatter = formatters[key];
  return formatter ? formatter(value) : value;
}

function normalizeShipments(response: ShipmentResponse): Shipment[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data) {
      return [data];
    }
  }

  if (response) {
    return [response as Shipment];
  }

  return [];
}

export default function PayloadTablePage() {
  const [shipments, setShipments] = useState<Shipment[]>([fallbackPayload]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchShipments = async () => {
      try {
        const response = await fetch(
          'http://localhost:3000/accounts/24e06318-600e-4d25-be1d-19ee72343399/shipments',
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as ShipmentResponse;
        const normalized = normalizeShipments(data);

        if (isMounted) {
          setShipments(normalized.length ? normalized : [fallbackPayload]);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load shipments.',
          );
          setShipments([fallbackPayload]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchShipments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container className="mt-12 pb-12">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Shipment Payload</h1>
            <p className="text-sm text-muted-foreground">
              Table rendering of the provided JSON payload.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? 'Loading latest shipments…' : 'Loaded'}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            API error: {error}. Showing fallback payload.
          </p>
        )}

        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map(shipment => (
                <TableRow
                  className="hover:bg-muted/50"
                  key={`${shipment.externalId}-${shipment.updatedAt}`}
                >
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {formatValue(column.key, shipment[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Container>
  );
}
