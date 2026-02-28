'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Shipment = Record<string, unknown>;

interface ShipmentsGridProps {
  shipments: Shipment[];
}

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const HIDDEN_COLUMNS = new Set([
  'account',
  'accountId',
  'origin',
  'id',
  'createdAt',
  'updatedAt',
]);

const COLUMN_LABELS: Record<string, string> = {
  externalId: '#Pedido',
  status: 'Status',
  invoiceCode: 'NFe',
  destination: 'Destino',
  value: 'Valor',
  startedAt: 'Iniciado em',
  deliveryEstimate: 'Prazo de Entrega',
  carrier: 'Transportadora',
  carrierStatus: 'Transportadora status',
  statusDescription: 'Detalhes status',
  deliveryEstimateDate: 'Data Estimada de Entrega',
  lastNotifiedAt: 'Ultima Notificacao',
};

const COLUMN_ORDER = [
  'externalId',
  'invoiceCode',
  'status',
  'destination',
  'value',
  'startedAt',
  'deliveryEstimateDate',
  'lastNotifiedAt',
  'carrier',
  'carrierStatus',
  'statusDescription',
] as const;

const formatDateTime = (value: unknown) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return formatCellValue(value);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatCellValue(value);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCurrencyBRL = (value: unknown) => {
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  if (Number.isNaN(number)) {
    return formatCellValue(value);
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
};

const formatColumnValue = (column: string, value: unknown) => {
  if (
    column === 'startedAt' ||
    column === 'deliveryEstimateDate' ||
    column === 'lastNotifiedAt'
  ) {
    return formatDateTime(value);
  }

  if (column === 'value') {
    return formatCurrencyBRL(value);
  }

  return formatCellValue(value);
};

export function ShipmentsGrid({ shipments }: ShipmentsGridProps) {
  if (!shipments.length) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No shipments found for this account.
      </p>
    );
  }

  const availableColumns = new Set(
    Array.from(
      shipments.reduce((keys, shipment) => {
        Object.keys(shipment).forEach(key => keys.add(key));
        return keys;
      }, new Set<string>()),
    ).filter(column => !HIDDEN_COLUMNS.has(column)),
  );

  const columns = COLUMN_ORDER.filter(column => availableColumns.has(column));

  return (
    <div className="mt-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHead key={column}>
                {COLUMN_LABELS[column] ?? column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment, index) => (
            <TableRow
              className="hover:bg-muted/50"
              key={String(shipment.id ?? shipment._id ?? index)}
            >
              {columns.map(column => (
                <TableCell key={`${column}-${index}`}>
                  {formatColumnValue(column, shipment[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
