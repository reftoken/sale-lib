import ethUtil from 'ethereumjs-util';
import Base58 from 'base-58';

/**
 * Deterministically generates shortId from given investorId and merchantId
 * @param {(string|Buffer)} investorId - investor id
 * @param {(string|Buffer)} merchantId - first 8 bytes of merchant id
 * @returns {string} short id (7 chars)
 */
const generateShortId = (investorId, merchantId) => {
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
};

/**
 * Converts uuid string to hex buffer. Does nothing if given key is not a string
 * @param {string} key - uuid
 * @returns {Buffer}
 */
const uuidToBin = (key) => {
  if (typeof key === 'string') {
    return new Buffer(key.replace(/-/g, ''), 'hex');
  }
  return key;
};

/**
 * Converts uuid string to hex buffer. Does nothing if given key is not a string
 * @param {Buffer} key - hex encoded binary key
 * @returns {string} - uuid string
 */
const binToUuid = (key) => {
  if (key instanceof Buffer) {
    if (key.length === 16) {
      return [
        key.slice(0, 4).toString('hex'),
        key.slice(4, 6).toString('hex'),
        key.slice(6, 8).toString('hex'),
        key.slice(8, 10).toString('hex'),
        key.slice(10, 16).toString('hex'),
      ].join('-');
    }
    if (key.length === 8) {
      return [
        key.slice(0, 4).toString('hex'),
        key.slice(4, 6).toString('hex'),
        key.slice(6, 8).toString('hex'),
      ].join('-');
    }
  }
  return key;
};

export default {
  generateShortId,
  uuidToBin,
  binToUuid,
};
