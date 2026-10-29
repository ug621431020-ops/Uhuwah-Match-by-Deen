// PromptPay EMVCo QR Code Generator for Thailand

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    let x2 = x ^ (x >> 4);
    crc = ((crc << 8) ^ (x2 << 12) ^ (x2 << 5) ^ x2) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize target (mobile number or national ID)
  const cleanTarget = target.replace(/[^0-9]/g, '');

  let targetType = '01'; // 01 = Mobile, 02 = National ID / Tax ID
  let formattedTarget = cleanTarget;

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile number: replace initial 0 with 0066 -> length 13
    targetType = '01';
    formattedTarget = '0066' + cleanTarget.substring(1);
  } else if (cleanTarget.length === 13) {
    // National ID or Tax ID
    targetType = '02';
    formattedTarget = cleanTarget;
  } else if (cleanTarget.length === 15) {
    // E-Wallet ID
    targetType = '03';
    formattedTarget = cleanTarget;
  }

  // Merchant Account Info (Tag 29)
  const aid = '0016A000000677010111';
  const targetSubtag = `${targetType}${formattedTarget.length.toString().padStart(2, '0')}${formattedTarget}`;
  const merchantInfoData = `${aid}${targetSubtag}`;
  const tag29 = `29${merchantInfoData.length.toString().padStart(2, '0')}${merchantInfoData}`;

  // Payload format indicator (000201)
  // Point of Initiation Method: 010212 (Dynamic with amount) or 010211 (Static without amount)
  const isDynamic = amount !== undefined && amount > 0;
  const tag01 = isDynamic ? '010212' : '010211';

  // Currency: 5303764 (THB)
  const tag53 = '5303764';

  // Amount: Tag 54
  let tag54 = '';
  if (isDynamic) {
    const amtStr = amount.toFixed(2);
    tag54 = `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
  }

  // Country code: 5802TH
  const tag58 = '5802TH';

  // Assemble before CRC
  const rawData = `000201${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(rawData);

  return `${rawData}${checksum}`;
}

export interface PaymentInfo {
  promptPayId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const DEFAULT_PAYMENT_INFO: PaymentInfo = {
  promptPayId: '0812345678',
  bankName: 'ธนาคารกสิกรไทย (KBank)',
  accountNumber: '123-4-56789-0',
  accountName: 'สมชาย เตะบอลเพลิน (ผู้จัด)',
};

const STORAGE_KEY_PAYMENT_INFO = 'thursday_turf_payment_info_v1';

export function getStoredPaymentInfo(): PaymentInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYMENT_INFO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read payment info', e);
  }
  return DEFAULT_PAYMENT_INFO;
}

export function saveStoredPaymentInfo(info: PaymentInfo): void {
  localStorage.setItem(STORAGE_KEY_PAYMENT_INFO, JSON.stringify(info));
}
