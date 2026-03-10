'use server';

import { fetchWithAuth } from '@/lib/fetch-with-auth';
import type { UpdateCheckedBody } from '@/types/api';

export async function updateShipmentChecked(
  accountId: string,
  shipmentId: string,
  body: UpdateCheckedBody,
) {
  await fetchWithAuth(
    `/accounts/${accountId}/shipments/${shipmentId}/checked`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
