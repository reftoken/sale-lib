import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import BigNumber from 'bignumber.js';
import Receipt, { Type } from './receipt';

chai.use(sinonChai);

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';
const ADDR = '0x82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f';

describe('receipt + signer ', () => {
  it('should allow to sign and parse whitelist receipt.', (done) => {
    const whitelistReceipt = 'AYYP.GDjNsGQbxIw8UiVmb4CNTx7kPTHL2oFlCneJqAkz0Bk=.TZX5U7UiqEMQX6+NAv3rUiX8KsjsJJYZwon6EC9bQ7k=.G5mqu8zd7v8AESIzIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    const saleAddr = '0x00112233445566778899aabbccddeeff00112233';
    const investorAddr = '0x2222222222222222222222222222222222222222';
    const whitelist = new Receipt(saleAddr).whitelist(investorAddr);
    // test signing
    expect(whitelist.sign(PRIV)).to.eql(whitelistReceipt);
    // test parse
    const whitelistParams = ['0x1838cdb0641bc48c3c5225666f808d4f1ee43d31cbda81650a7789a80933d019', '0x4d95f953b522a843105faf8d02fdeb5225fc2ac8ec249619c289fa102f5b43b9', '0x1b99aabbccddeeff001122332222222222222222222222222222222222222222'];
    expect(Receipt.parseToParams(whitelistReceipt)).to.eql(whitelistParams);
    expect(Receipt.parse(whitelistReceipt)).to.eql({
      investorAddr,
      signer: ADDR,
      type: Type.WHITELIST,
    });
    done();
  });
  it('should allow to sign and parse session receipt.', (done) => {
    const sessionReceipt = 'CIYP.BUj1DVxVn/giqS30O+gPdZ8U1Xmwmzi8l6Y1x0Hdark=.bxGXdffLYN6nyyUxbqoEOgYi9mQbd/JA0iTX59UpKrQ=.HBF8UqmkWUpvntIgtxOh7NCvMe9qs6hNalj5n9EAAAA=';
    const created = 1492754385;
    const investorId = '117c52a9-a459-4a6f-9ed2-20b713a1ecd0';
    const merchantId = 'af31ef6a-b3a8-4d6a';
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
    done();
  });
});
