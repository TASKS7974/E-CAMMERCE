import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function downloadPurchaseSummary(csv) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }

  const file = new File(Paths.cache, `dg-purchase-summary-${Date.now()}.csv`);
  file.create();
  await file.write(csv);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Purchase summary',
    mimeType: 'text/csv',
  });
}
