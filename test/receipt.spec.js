import { expect } from 'chai';
import Receipt, { Type } from '../lib/receipt';

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';
const ADDR = '0x82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f';
const merchantId = 'af31ef6a-b3a8-4d6a';
const saleAddr = '0x00112233445566778899aabbccddeeff00112233';
const investorId = '117c52a9-a459-4a6f-9ed2-20b713a1ecd0';
const investorAddr = '0x2222222222222222222222222222222222222222';

describe('receipt + signer ', () => {
  it('should allow to sign and parse whitelist receipt.', () => {
    const whitelistReceipt = 'AYYP.jgaMXV5sFyqanZgzy8yFN++HcsFYbdUyKOWxmEqCZ3U=.cmQcWcq9eoX8XyLF7T1vUeCJnhljvCngH9OJXmEt7UY=.G93u/wARIjNY+Z/RIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    const created = 1492754385;
    const whitelist = new Receipt(saleAddr).whitelist(investorAddr, created);
    // test signing
    expect(whitelist.sign(PRIV)).to.eql(whitelistReceipt);
    // test parse
    const whitelistParams = ['0x8e068c5d5e6c172a9a9d9833cbcc8537ef8772c1586dd53228e5b1984a826775', '0x72641c59cabd7a85fc5f22c5ed3d6f51e0899e1963bc29e01fd3895e612ded46', '0x1bddeeff0011223358f99fd12222222222222222222222222222222222222222'];
    expect(Receipt.parseToParams(whitelistReceipt)).to.eql(whitelistParams);
    expect(Receipt.parse(whitelistReceipt)).to.eql({
      investorAddr,
      created,
      signer: ADDR,
      type: Type.WHITELIST,
    });
  });

  it('should fail if miliseconds provided for created.', () => {
    try {
      new Receipt(saleAddr).whitelist(investorAddr, Date.now());
      throw new Error('should have thrown');
    } catch (e) {
      // success
    }
  });

  it('should allow to sign and parse session receipt.', () => {
    const sessionReceipt = 'CIYP.BUj1DVxVn/giqS30O+gPdZ8U1Xmwmzi8l6Y1x0Hdark=.bxGXdffLYN6nyyUxbqoEOgYi9mQbd/JA0iTX59UpKrQ=.HBF8UqmkWUpvntIgtxOh7NCvMe9qs6hNalj5n9EAAAA=';
    const created = 1492754385;
    const session = new Receipt().session(investorId, merchantId, created);
    // test signing
    expect(session.sign(PRIV)).to.eql(sessionReceipt);
    // test parse
    expect(Receipt.parse(sessionReceipt)).to.eql({
      created,
      investorId,
      merchantId,
      signer: ADDR,
      type: Type.SESSION,
    });
    // should allow to get shortId
    expect(session.shortId()).to.eql('9xRuHU7');
  });

  it('should allow to sign and parse investment receipt.', () => {
    const investReceipt = 'AoYP.n2/6jTR4n11r7lmkYYWZOk3EC5vtWh//IgEJJq+GzDw=.entfhjjnE+sYIFoGaOc/0wgpt86CUn8tRlqbpV3TvN0=.HN3u/wARIjNEVWZ3IiIiIiIiIiIiIiIiIiIiIiIiIiI=.WPmf0QAA1VaXywLSMzMzMzMzMzMzMzMzMzMzMzMzMzM=';
    const affiliateAddr = '0x3333333333333333333333333333333333333333';
    const orderId = '0x44556677';
    const oobpa = 234567890567890;
    const created = 1492754385;
    const invest = new Receipt(saleAddr)
      .investment(investorAddr, affiliateAddr, oobpa, orderId, created);
    // test signing
    expect(invest.sign(PRIV)).to.eql(investReceipt);
    // test parse
    const investParams = ['0x9f6ffa8d34789f5d6bee59a46185993a4dc40b9bed5a1fff22010926af86cc3c', '0x7a7b5f8638e713eb18205a0668e73fd30829b7ce82527f2d465a9ba55dd3bcdd', '0x1cddeeff00112233445566772222222222222222222222222222222222222222', '0x58f99fd10000d55697cb02d23333333333333333333333333333333333333333'];
    expect(Receipt.parseToParams(investReceipt)).to.eql(investParams);
    expect(Receipt.parse(investReceipt)).to.eql({
      investorAddr,
      targetAddr: `0x${saleAddr.substring(28, 42)}`,
      affiliateAddr,
      oobpa,
      orderId,
      signer: ADDR,
      type: Type.INVEST,
    });
  });

  it('should allow to get short Id.', () => {
    const session = new Receipt().session(investorId, merchantId);
    // should allow to get shortId
    expect(session.shortId()).to.eql('9xRuHU7');
  });

  it('should allow to sign and parse message receipt.', () => {
    const messageReceipt = 'KYYP.r0ciB80ze2ZDYqQMPAuB1ML5E90Sk67COKMr27Ycs8E=.cDaKjZsdWxiwWbBTzNfho0ePAXDUps3IpsNh8Mk48ps=.HAABW48YSGivMe9qs6hNagAAAAAAAAAAAAAAAAAAAAc=.bWVzc2FnZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const created = 1492754385000;
    const msg = new Receipt(merchantId).message('message', created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      merchantId,
      message: 'message',
      signer: ADDR,
      type: Type.MESSAGE,
    });
  });

  it('should allow to sign and parse message receipt with BMP chars.', () => {
    const messageReceipt = 'KYYP.kPRzkuKXLAAvG64QzvgkiVQbwKzYttZT2Q8oB8YH0l4=.YRdb0fEhaPabTX4DUMX4UMXW5sUNqMl2IEeh6nL/Jns=.HAABW48YSGivMe9qs6hNagAAAAAAAAAAAAAAAAAAABc=.SGVsbG/nq5wgw7Yg4oKsIM6pIPCdhJ4AAAAAAAAAAAA=';
    const created = 1492754385000;
    const msg = new Receipt(merchantId).message('Hello竜 ö € Ω 𝄞', created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      merchantId,
      message: 'Hello竜 ö € Ω 𝄞',
      signer: ADDR,
      type: Type.MESSAGE,
    });
  });

  it('should allow to sign and parse message receipt longer than 32 bytes.', () => {
    const messageReceipt = 'KYYP.vaQdLdl23PUN2n0dEK3V8kSWYT2sOskqc2Knic6jlLQ=.GiwTtRNjf5gpAck1WEtOLllNwuf/K6+M6IJ5jJgaPdU=.GwABW48YSGivMe9qs6hNagAAAAAAAAAAAAAAAAAAAEE=.bWVzc2FnZSB0aGF0IGhhcyBtb3JlIGNoYXJhY3RlcnM=.IHRoYW4gMzIgYnl0ZXMsIDY1IHRvIGJlIHByZWNpc2U=.LgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const created = 1492754385000;
    const text = 'message that has more characters than 32 bytes, 65 to be precise.';
    const msg = new Receipt(merchantId).message(text, created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      merchantId,
      message: text,
      signer: ADDR,
      type: Type.MESSAGE,
    });
  });
});
