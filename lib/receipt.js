import assert from 'assert';
import ethUtil from 'ethereumjs-util';
import querystring from 'querystring';
import Signer from './signer';

export const Type = {
  WHITELIST: 1,
  INVEST: 2,
  SESSION: 8,
  MESSAGE: 41,
};
const MAX_UINT32 = 0xFFFFFFFF;


/**
* A receipt should authenticate the signer to a contract function
*/
export default class Receipt {
  constructor(targetAddr) {
    this.targetAddr = targetAddr;
  }

  /**
  * whitelist receipts authenticates an investor to the sale contract
  */
  whitelist(...args) {
    const [investorAddr, created = Math.floor(Date.now() / 1000)] = args;
    assert((created >>> 0) === created, 'created has to be in secronds'); // eslint-disable-line no-bitwise
    // make leave receipt
    // size: 32bytes receipt
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <7 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes created timestamp>
    payload.writeUInt32BE(created, 8);
    // <20 bytes investorAddr>
    payload.write(investorAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.WHITELIST);
  }

  /**
  * investment receipts defines a payment for a deal contract
  */
  investment(...args) {
    const [investorAddr, referenceHash, oobpa,
      orderId = '00000000', created = Math.floor(Date.now() / 1000)] = args;
    assert((created >>> 0) === created, 'created has to be in seconds'); // eslint-disable-line no-bitwise
    const payload1 = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload1.writeUInt8(0, 0);
    // <7 bytes targetAddr>
    payload1.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes orderId>
    payload1.write(orderId.replace('0x', ''), 8, 'hex');
    // <20 bytes investorAddr>
    payload1.write(investorAddr.replace('0x', ''), 12, 'hex');

    const payload2 = Buffer.alloc(32);
    // <4 bytes created timestamp>
    payload2.writeUInt32BE(created, 0);
    // write oobpa
    const big = ~~(oobpa / MAX_UINT32); // eslint-disable-line no-bitwise
    const low = (oobpa % MAX_UINT32) - big;
    payload2.writeUInt32BE(big, 4);
    payload2.writeUInt32BE(low, 8);
    // <4 bytes referenceHash>
    payload2.writeUInt32BE(referenceHash, 12);
    return new Signer(args, [payload1, payload2], Type.INVEST);
  }

  /**
  * created for user and delivered via magic-link
  */
  session(...args) { // eslint-disable-line class-methods-use-this
    const [investorId, merchantId, created = Math.floor(Date.now() / 1000)] = args;
    const payload = Buffer.alloc(32, 0);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <16 bytes investor uuid>
    if (investorId instanceof Buffer) {
      investorId.copy(payload, 1);
    } else {
      payload.write(investorId.replace(/-/g, ''), 1, 'hex');
    }
    // <8 bytes first half of merchant uuid>
    if (merchantId instanceof Buffer) {
      merchantId.copy(payload, 17);
    } else {
      payload.write(merchantId.replace(/-/g, ''), 17, 'hex');
    }
    // <4 bytes created time>
    payload.writeUInt32BE(created, 25);
    // <3 bytes 0x00 >
    payload.writeUInt8(0, 29);
    payload.writeUInt8(0, 30);
    payload.writeUInt8(0, 31);
    return new Signer(args, [payload], Type.SESSION);
  }

  message(...args) {
    const [msg, created = Date.now()] = args;
    const msgLength = Buffer.byteLength(msg, 'utf8');
    // make message receipt
    // 1b 0x00 space for v
    // 7b for time in milli
    // 20b table address
    // 4b for msg length in bytes
    // 1 + 7 + 20 + 4 + msgLength < 32 * 8
    if (msgLength > 32 * 7) {
      throw Error(`msg too long:${msgLength}`);
    }
    // Buffer.alloc(size[, fill[, encoding]])
    // If fill is undefined, the Buffer will be zero-filled.
    const sliceCount = Math.floor(msgLength / 32) + 2;
    const payload = Buffer.alloc(sliceCount * 32);
    // write timestamp to buffer
    const big = ~~(created / MAX_UINT32); // eslint-disable-line no-bitwise
    const low = (created % MAX_UINT32) - big;
    payload.writeUInt32BE(big, 0);
    payload.writeUInt32BE(low, 4);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <8 bytes merchantId>
    if (this.targetAddr instanceof Buffer) {
      this.targetAddr.copy(payload, 8);
    } else {
      payload.write(this.targetAddr.replace(/-/g, ''), 8, 'hex');
    }
    // <4 bytes message length>
    payload.writeUInt32BE(msgLength, 28);
    // <xx bytes message>
    payload.write(msg, 32, 'utf8');
    const slices = [];
    for (let i = 0; i < sliceCount; i += 1) {
      slices.push(payload.slice(i * 32, (i + 1) * 32));
    }
    return new Signer(args, slices, Type.MESSAGE);
  }

  static parseToParams(receipt) {
    const bufs = this.parseToBuf(receipt);
    if (bufs.type === Type.SETTLE) {
      const v = bufs.parts[2].readUInt8(0);
      bufs.parts[2].writeUInt8(0, 0);
      return [`0x${v.toString(16)}${bufs.parts[0].toString('hex')}${bufs.parts[1].toString('hex')}`, `0x${bufs.parts[2].toString('hex')}`, `0x${bufs.parts[3].toString('hex')}`];
    }
    return bufs.parts.map(buf => `0x${buf.toString('hex')}`);
  }

  static parse(receipt) {
    const bufs = this.parseToBuf(receipt);
    const rv = { signer: bufs.signer, type: bufs.type };
    switch (bufs.type) {
      case Type.WHITELIST: {
        rv.investorAddr = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        rv.created = bufs.parts[2].readUInt32BE(8);
        break;
      }
      case Type.INVEST: {
        rv.targetAddr = `0x${bufs.parts[2].slice(1, 8).toString('hex')}`;
        rv.orderId = `0x${bufs.parts[2].slice(8, 12).toString('hex')}`;
        rv.investorAddr = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        rv.referenceHash = `0x${bufs.parts[3].slice(12, 32).toString('hex')}`;
        rv.oobpa = parseInt(bufs.parts[3].slice(4, 12).toString('hex'), 16);
        break;
      }
      case Type.SESSION: {
        const p = bufs.parts[2];
        rv.investorId = `${p.slice(1, 5).toString('hex')}-${p.slice(5, 7).toString('hex')}-${p.slice(7, 9).toString('hex')}-${p.slice(9, 11).toString('hex')}-${p.slice(11, 17).toString('hex')}`;
        rv.merchantId = `${p.slice(17, 21).toString('hex')}-${p.slice(21, 23).toString('hex')}-${p.slice(23, 25).toString('hex')}`;
        rv.created = p.readUInt32BE(25);
        break;
      }
      case Type.MESSAGE: {
        const p = bufs.parts[2];
        rv.created = parseInt(bufs.parts[2].slice(1, 8).toString('hex'), 16);
        rv.merchantId = `${p.slice(8, 12).toString('hex')}-${p.slice(12, 14).toString('hex')}-${p.slice(14, 16).toString('hex')}`;
        let msgLength = bufs.parts[2].readUInt32BE(28);
        const partsLength = Math.floor(msgLength / 32) + 1;
        rv.message = '';
        for (let i = 0; i < partsLength; i += 1) {
          if (msgLength >= 32) {
            rv.message += bufs.parts[3 + i].toString('utf8');
          } else {
            rv.message += bufs.parts[3 + i].slice(0, msgLength).toString('utf8');
          }
          msgLength -= 32;
        }
        break;
      }
      default: {
        throw new Error(`unknown receipt type: ${bufs.type}.`);
      }
    }
    return rv;
  }

  static parseToBuf(receipt) {
    const parts = receipt.split('.');
    if (parts.length < 4) {
      throw new Error('malformed receipt.');
    }

    const headBuf = Buffer.alloc(3);
    headBuf.write(parts[0], 'base64');
    const type = headBuf.readUInt8(0);

    const r = Buffer.alloc(32);
    r.write(parts[1], 'base64');
    const s = Buffer.alloc(32);
    s.write(parts[2], 'base64');
    const first = Buffer.alloc(32);
    first.write(parts[3], 'base64');
    const v = first.readUInt8(0);
    first.writeUInt8(0, 0);
    const partBufs = [r, s];
    let hash;
    switch (type) {
      case Type.SESSION:
      case Type.WHITELIST: {
        hash = ethUtil.sha3(first);
        first.writeUInt8(v, 0);
        partBufs.push(first);
        break;
      }
      case Type.INVEST: {
        const second = Buffer.alloc(32);
        second.write(parts[4], 'base64');
        hash = ethUtil.sha3(Buffer.concat([first, second]));
        first.writeUInt8(v, 0);
        partBufs.push(first);
        partBufs.push(second);
        break;
      }
      case Type.MESSAGE: {
        partBufs.push(null);
        const payloadBufs = [first];
        for (let i = 4; i < parts.length; i += 1) {
          const partBuf = Buffer.alloc(32);
          partBuf.write(parts[i], 'base64');
          partBufs.push(partBuf);
          payloadBufs.push(partBuf);
        }
        hash = ethUtil.sha3(Buffer.concat(payloadBufs));
        first.writeUInt8(v, 0);
        partBufs[2] = first;
        break;
      }
      default: {
        throw new Error(`unknown receipt type: ${type}.`);
      }
    }
    const pub = ethUtil.ecrecover(hash, v, r, s);
    const signer = ethUtil.publicToAddress(pub);
    if (headBuf[1] !== signer[18] || headBuf[2] !== signer[19]) {
      throw new Error('signature verification failed');
    }
    return {
      type,
      parts: partBufs,
      signer: `0x${signer.toString('hex')}`,
    };
  }

  static isEscaped(receiptStr) {
    return receiptStr.indexOf('%3D') > -1;
  }

  static maybeUnescape(receiptStr) {
    if (Receipt.isEscaped(receiptStr)) {
      return querystring.unescape(receiptStr);
    }

    return receiptStr;
  }

  static maybeEscape(receiptStr) {
    if (!Receipt.isEscaped(receiptStr)) {
      return querystring.escape(receiptStr);
    }

    return receiptStr;
  }

}
