import ethUtil from 'ethereumjs-util';
import BigNumber from 'bignumber.js';
import Signer from './signer';

export const Type = {
  WHITELIST: 1
};


/**
* A receipt should authenticate the signer to a contract function
* a receipt should transport a destination address, ideally a nonce
* and shall fit into few multiple of bytes32
*/
export default class Receipt {
  constructor(targetAddr) {
    this.targetAddr = targetAddr;
  }

  // leave create a leave receipt
  // a leave receipts is signed by the oracle to exit a player from the table
  // at a specific handId.
  // when the leave receipt is accepted in the contract, the exitHand of the player
  // is set to the handId provider in the receipt
  // and a nettingRequest is created at handId
  whitelist(...args) {
    const [investorAddr] = args;
    // make leave receipt
    // size: 32bytes receipt
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <11 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(18, 40), 1, 'hex');
    // <20 bytes investorAddr>
    payload.write(investorAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.WHITELIST);
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
      case Type.WHITELIST: {
        hash = ethUtil.sha3(first);
        first.writeUInt8(v, 0);
        partBufs.push(first);
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

}
