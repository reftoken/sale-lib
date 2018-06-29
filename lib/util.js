import ethUtil from 'ethereumjs-util';
import Base58 from 'base-58';

/**
 * Deterministically generates shortId from given investorId and merchantId
 * @param {(string|Buffer)} investorId - investor id
 * @param {(string|Buffer)} merchantId - first 8 bytes of merchant id
 * @returns {string} short id (7 chars)
 */
export const generateShortId = (investorId, merchantId) => {
  const payload = Buffer.alloc(24);

  if (investorId instanceof Buffer) {
    investorId.copy(payload, 0);
  } else {
    payload.write(investorId.replace(/-/g, ''), 0, 'hex');
  }

  // <8 bytes first half of merchant uuid>
  if (merchantId instanceof Buffer) {
    merchantId.copy(payload, 16);
  } else {
    payload.write(merchantId.replace(/-/g, ''), 16, 'hex');
  }

  const hash = ethUtil.sha3(payload);
  return Base58.encode(hash).substring(0, 7);
}
