'use server';

import { fetchWithAuth } from '@/lib/fetch-with-auth';

const ACCOUNT_ID = 'f0e773e8-2918-41ff-a1ad-16afe52a4a6b';

export async function getAccountShipments() {
  try {
    const response = await fetchWithAuth(`/accounts/${ACCOUNT_ID}/shipments`, {
      cache: 'no-store',
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching account shipments:', error);
    return null;
  }
}
