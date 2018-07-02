'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.Type = undefined;var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);var _createClass2 = require('babel-runtime/helpers/createClass');var _createClass3 = _interopRequireDefault(_createClass2);var _assert = require('assert');var _assert2 = _interopRequireDefault(_assert);
var _ethereumjsUtil = require('ethereumjs-util');var _ethereumjsUtil2 = _interopRequireDefault(_ethereumjsUtil);
var _querystring = require('querystring');var _querystring2 = _interopRequireDefault(_querystring);
var _signer = require('./signer');var _signer2 = _interopRequireDefault(_signer);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var Type = exports.Type = {
  WHITELIST: 1,
  INVEST: 2,
  SESSION: 8,
  MESSAGE: 41 };

var MAX_UINT32 = 0xFFFFFFFF;


/**
                             * A receipt should authenticate the signer to a contract function
                             */var
Receipt = function () {
  function Receipt(targetAddr) {(0, _classCallCheck3.default)(this, Receipt);
    this.targetAddr = targetAddr;
  }

  /**
    * whitelist receipts authenticates an investor to the sale contract
    */(0, _createClass3.default)(Receipt, [{ key: 'whitelist', value: function whitelist()
    {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}var
      investorAddr = args[0],_args$ = args[1],created = _args$ === undefined ? Math.floor(Date.now() / 1000) : _args$;
      (0, _assert2.default)(created >>> 0 === created, 'created has to be in secronds'); // eslint-disable-line no-bitwise
      // make leave receipt
      // size: 32bytes receipt
      var payload = Buffer.alloc(32);
      // <1 bytes 0x00 space for v>
      payload.writeUInt8(0, 0);
      // <7 bytes targetAddr>
      payload.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
      // <4 bytes created timestamp>
      payload.writeUInt32BE(created, 8);
      // <20 bytes investorAddr>
      payload.write(investorAddr.replace('0x', ''), 12, 'hex');
      return new _signer2.default(args, [payload], Type.WHITELIST);
    }

    /**
      * investment receipts defines a payment for a deal contract
      */ }, { key: 'investment', value: function investment()
    {for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}var
      investorAddr = args[0],affiliateAddr = args[1],oobpa = args[2],_args$2 = args[3],created = _args$2 === undefined ? Math.floor(Date.now() / 1000) : _args$2;
      (0, _assert2.default)(created >>> 0 === created, 'created has to be in secronds'); // eslint-disable-line no-bitwise
      var payload1 = Buffer.alloc(32);
      // <1 bytes 0x00 space for v>
      payload1.writeUInt8(0, 0);
      // <11 bytes targetAddr>
      payload1.write(this.targetAddr.replace('0x', '').substring(18, 40), 1, 'hex');
      // <20 bytes investorAddr>
      payload1.write(investorAddr.replace('0x', ''), 12, 'hex');

      var payload2 = Buffer.alloc(32);
      // <4 bytes created timestamp>
      payload2.writeUInt32BE(created, 0);
      // write oobpa
      var big = ~~(oobpa / MAX_UINT32); // eslint-disable-line no-bitwise
      var low = oobpa % MAX_UINT32 - big;
      payload2.writeUInt32BE(big, 4);
      payload2.writeUInt32BE(low, 8);
      // <20 bytes affiliateAddr>
      payload2.write(affiliateAddr.replace('0x', ''), 12, 'hex');
      return new _signer2.default(args, [payload1, payload2], Type.INVEST);
    }

    /**
      * created for user and delivered via magic-link
      */ }, { key: 'session', value: function session()
    {for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {args[_key3] = arguments[_key3];} // eslint-disable-line class-methods-use-this
      var investorId = args[0],merchantId = args[1],_args$3 = args[2],created = _args$3 === undefined ? Math.floor(Date.now() / 1000) : _args$3;
      var payload = Buffer.alloc(32, 0);
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
      return new _signer2.default(args, [payload], Type.SESSION);
    } }, { key: 'message', value: function message()

    {for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {args[_key4] = arguments[_key4];}var
      msg = args[0],_args$4 = args[1],created = _args$4 === undefined ? Date.now() : _args$4;
      var msgLength = Buffer.byteLength(msg, 'utf8');
      // make message receipt
      // 1b 0x00 space for v
      // 7b for time in milli
      // 20b table address
      // 4b for msg length in bytes
      // 1 + 7 + 20 + 4 + msgLength < 32 * 8
      if (msgLength > 32 * 7) {
        throw Error('msg too long:' + msgLength);
      }
      // Buffer.alloc(size[, fill[, encoding]])
      // If fill is undefined, the Buffer will be zero-filled.
      var sliceCount = Math.floor(msgLength / 32) + 2;
      var payload = Buffer.alloc(sliceCount * 32);
      // write timestamp to buffer
      var big = ~~(created / MAX_UINT32); // eslint-disable-line no-bitwise
      var low = created % MAX_UINT32 - big;
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
      var slices = [];
      for (var i = 0; i < sliceCount; i += 1) {
        slices.push(payload.slice(i * 32, (i + 1) * 32));
      }
      return new _signer2.default(args, slices, Type.MESSAGE);
    } }], [{ key: 'parseToParams', value: function parseToParams(

    receipt) {
      var bufs = this.parseToBuf(receipt);
      if (bufs.type === Type.SETTLE) {
        var v = bufs.parts[2].readUInt8(0);
        bufs.parts[2].writeUInt8(0, 0);
        return ['0x' + v.toString(16) + bufs.parts[0].toString('hex') + bufs.parts[1].toString('hex'), '0x' + bufs.parts[2].toString('hex'), '0x' + bufs.parts[3].toString('hex')];
      }
      return bufs.parts.map(function (buf) {return '0x' + buf.toString('hex');});
    } }, { key: 'parse', value: function parse(

    receipt) {
      var bufs = this.parseToBuf(receipt);
      var rv = { signer: bufs.signer, type: bufs.type };
      switch (bufs.type) {
        case Type.WHITELIST:{
            rv.investorAddr = '0x' + bufs.parts[2].slice(12, 32).toString('hex');
            rv.created = bufs.parts[2].readUInt32BE(8);
            break;
          }
        case Type.INVEST:{
            rv.targetAddr = '0x' + bufs.parts[2].slice(1, 12).toString('hex');
            rv.investorAddr = '0x' + bufs.parts[2].slice(12, 32).toString('hex');
            rv.affiliateAddr = '0x' + bufs.parts[3].slice(12, 32).toString('hex');
            rv.oobpa = parseInt(bufs.parts[3].slice(4, 12).toString('hex'), 16);
            break;
          }
        case Type.SESSION:{
            var p = bufs.parts[2];
            rv.investorId = p.slice(1, 5).toString('hex') + '-' + p.slice(5, 7).toString('hex') + '-' + p.slice(7, 9).toString('hex') + '-' + p.slice(9, 11).toString('hex') + '-' + p.slice(11, 17).toString('hex');
            rv.merchantId = p.slice(17, 21).toString('hex') + '-' + p.slice(21, 23).toString('hex') + '-' + p.slice(23, 25).toString('hex');
            rv.created = p.readUInt32BE(25);
            break;
          }
        case Type.MESSAGE:{
            var _p = bufs.parts[2];
            rv.created = parseInt(bufs.parts[2].slice(1, 8).toString('hex'), 16);
            rv.merchantId = _p.slice(8, 12).toString('hex') + '-' + _p.slice(12, 14).toString('hex') + '-' + _p.slice(14, 16).toString('hex');
            var msgLength = bufs.parts[2].readUInt32BE(28);
            var partsLength = Math.floor(msgLength / 32) + 1;
            rv.message = '';
            for (var i = 0; i < partsLength; i += 1) {
              if (msgLength >= 32) {
                rv.message += bufs.parts[3 + i].toString('utf8');
              } else {
                rv.message += bufs.parts[3 + i].slice(0, msgLength).toString('utf8');
              }
              msgLength -= 32;
            }
            break;
          }
        default:{
            throw new Error('unknown receipt type: ' + bufs.type + '.');
          }}

      return rv;
    } }, { key: 'parseToBuf', value: function parseToBuf(

    receipt) {
      var parts = receipt.split('.');
      if (parts.length < 4) {
        throw new Error('malformed receipt.');
      }

      var headBuf = Buffer.alloc(3);
      headBuf.write(parts[0], 'base64');
      var type = headBuf.readUInt8(0);

      var r = Buffer.alloc(32);
      r.write(parts[1], 'base64');
      var s = Buffer.alloc(32);
      s.write(parts[2], 'base64');
      var first = Buffer.alloc(32);
      first.write(parts[3], 'base64');
      var v = first.readUInt8(0);
      first.writeUInt8(0, 0);
      var partBufs = [r, s];
      var hash = void 0;
      switch (type) {
        case Type.SESSION:
        case Type.WHITELIST:{
            hash = _ethereumjsUtil2.default.sha3(first);
            first.writeUInt8(v, 0);
            partBufs.push(first);
            break;
          }
        case Type.INVEST:{
            var second = Buffer.alloc(32);
            second.write(parts[4], 'base64');
            hash = _ethereumjsUtil2.default.sha3(Buffer.concat([first, second]));
            first.writeUInt8(v, 0);
            partBufs.push(first);
            partBufs.push(second);
            break;
          }
        case Type.MESSAGE:{
            partBufs.push(null);
            var payloadBufs = [first];
            for (var i = 4; i < parts.length; i += 1) {
              var partBuf = Buffer.alloc(32);
              partBuf.write(parts[i], 'base64');
              partBufs.push(partBuf);
              payloadBufs.push(partBuf);
            }
            hash = _ethereumjsUtil2.default.sha3(Buffer.concat(payloadBufs));
            first.writeUInt8(v, 0);
            partBufs[2] = first;
            break;
          }
        default:{
            throw new Error('unknown receipt type: ' + type + '.');
          }}

      var pub = _ethereumjsUtil2.default.ecrecover(hash, v, r, s);
      var signer = _ethereumjsUtil2.default.publicToAddress(pub);
      if (headBuf[1] !== signer[18] || headBuf[2] !== signer[19]) {
        throw new Error('signature verification failed');
      }
      return {
        type: type,
        parts: partBufs,
        signer: '0x' + signer.toString('hex') };

    } }, { key: 'isEscaped', value: function isEscaped(

    receiptStr) {
      return receiptStr.indexOf('%3D') > -1;
    } }, { key: 'maybeUnescape', value: function maybeUnescape(

    receiptStr) {
      if (Receipt.isEscaped(receiptStr)) {
        return _querystring2.default.unescape(receiptStr);
      }

      return receiptStr;
    } }, { key: 'maybeEscape', value: function maybeEscape(

    receiptStr) {
      if (!Receipt.isEscaped(receiptStr)) {
        return _querystring2.default.escape(receiptStr);
      }

      return receiptStr;
    } }]);return Receipt;}();exports.default = Receipt;