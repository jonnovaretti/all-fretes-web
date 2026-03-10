'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { updateShipmentChecked } from '@/modules/shipment/actions/update-shipment-checked';
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
  accountId: string;
  shipments: Shipment[];
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
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
  'checked',
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
  totalDaysEstimated: 'Prazo de Entrega',
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
  if (column === 'startedAt' || column === 'lastNotifiedAt' || column === 'deliveryEstimateDate') {
    return formatDateTime(value);
  }

  if (column === 'value') {
    return formatCurrencyBRL(value);
  }

  if (column === 'totalDaysEstimated') {
    return `${value} dias uteis`;
  }

  return formatCellValue(value);
};

const getRowStatusClassName = (status: unknown) => {
  if (typeof status !== 'string') {
    return 'hover:bg-muted/50';
  }

  const normalizedStatus = status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (normalizedStatus === 'finished') {
    return 'bg-green-200 text-slate-900 hover:bg-green-300';
  }

  if (normalizedStatus === 'delayed') {
    return 'bg-yellow-200 text-slate-900 hover:bg-yellow-300';
  }

  if (normalizedStatus === 'returning') {
    return 'bg-orange-200 text-slate-900 hover:bg-orange-300';
  }

  if (normalizedStatus === 'intransit') {
    return 'hover:bg-muted/50';
  }

  return 'hover:bg-muted/50';
};

export function ShipmentsGrid({
  accountId,
  shipments,
  currentPage,
  hasNextPage,
  onPageChange,
  isLoading = false,
}: ShipmentsGridProps) {
  const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({});
  const [pendingCheck, setPendingCheck] = useState<{ shipmentId: string; checked: boolean } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const availableColumns = new Set(
    Array.from(
      shipments.reduce((keys, shipment) => {
        Object.keys(shipment).forEach(key => keys.add(key));
        return keys;
      }, new Set<string>()),
    ).filter(column => !HIDDEN_COLUMNS.has(column)),
  );

  const columns = COLUMN_ORDER.filter(column => availableColumns.has(column));

  const handleCheckboxClick = (shipmentId: string, currentChecked: boolean) => {
    setPendingCheck({ shipmentId, checked: !currentChecked });
  };

  const handleConfirm = async () => {
    if (!pendingCheck) return;
    setIsConfirming(true);
    try {
      await updateShipmentChecked(accountId, pendingCheck.shipmentId, {
        checked: pendingCheck.checked,
      });
      setCheckedOverrides(prev => ({
        ...prev,
        [pendingCheck.shipmentId]: pendingCheck.checked,
      }));
    } finally {
      setIsConfirming(false);
      setPendingCheck(null);
    }
  };

  const handleCancel = () => {
    setPendingCheck(null);
  };

  if (!shipments.length) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No shipments found for this account.
      </p>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={pendingCheck !== null}
        title="Confirmar checagem"
        description={
          pendingCheck?.checked
            ? 'Deseja marcar este pedido como checado?'
            : 'Deseja desmarcar este pedido como checado?'
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isConfirming}
      />

      <div className="mt-2 space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column}>
                    {COLUMN_LABELS[column] ?? column}
                  </TableHead>
                ))}
                <TableHead>Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment, index) => {
                const shipmentId = String(shipment.id ?? shipment._id ?? index);
                const isChecked =
                  shipmentId in checkedOverrides
                    ? checkedOverrides[shipmentId]
                    : Boolean(shipment.checked);

                return (
                  <TableRow
                    className={getRowStatusClassName(shipment.consolidatedStatus)}
                    key={shipmentId}
                  >
                    {columns.map(column => (
                      <TableCell key={`${column}-${index}`}>
                        {column === 'externalId' && shipment[column] ? (
                          <a
                            href={`https://gofretes.com.br/Rastreamento?query=${shipment[column]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:opacity-70"
                          >
                            {formatColumnValue(column, shipment[column])}
                          </a>
                        ) : (
                          formatColumnValue(column, shipment[column])
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxClick(shipmentId, isChecked)}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="px-3 text-sm text-muted-foreground">
            Page {currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
