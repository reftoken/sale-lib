'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _ethereumjsUtil = require('ethereumjs-util');var _ethereumjsUtil2 = _interopRequireDefault(_ethereumjsUtil);
var _base = require('base-58');var _base2 = _interopRequireDefault(_base);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

/**
                                                                                                                                                                         * Deterministically generates shortId from given investorId and merchantId
                                                                                                                                                                         * @param {(string|Buffer)} investorId - investor id
                                                                                                                                                                         * @param {(string|Buffer)} merchantId - first 8 bytes of merchant id
                                                                                                                                                                         * @returns {string} short id (7 chars)
                                                                                                                                                                         */
var generateShortId = function generateShortId(investorId, merchantId) {
  var payload = Buffer.alloc(24);

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

  var hash = _ethereumjsUtil2.default.sha3(payload);
  return _base2.default.encode(hash).substring(0, 7);
};

/**
    * Converts uuid string to hex buffer. Does nothing if given key is not a string
    * @param {string} key - uuid
    * @returns {Buffer}
    */
var uuidToBin = function uuidToBin(key) {
  return typeof key === 'string' ? new Buffer(key.replace(/-/g, ''), 'hex') : key;
};

/**
    * Converts uuid string to hex buffer. Does nothing if given key is not a string
    * @param {Buffer} key - hex encoded binary key
    * @returns {string} - uuid string
    */
var binToUuid = function binToUuid(key) {
  if (key instanceof Buffer) {
    if (key.length === 16) {
      return [
      key.slice(0, 4).toString('hex'),
      key.slice(4, 6).toString('hex'),
      key.slice(6, 8).toString('hex'),
      key.slice(8, 10).toString('hex'),
      key.slice(10, 16).toString('hex')].
      join('-');
    }
    if (key.length === 8) {
      return [
      key.slice(0, 4).toString('hex'),
      key.slice(4, 6).toString('hex'),
      key.slice(6, 8).toString('hex')].
      join('-');
    }
  }
  return key;
};exports.default =

{
  generateShortId: generateShortId,
  uuidToBin: uuidToBin,
  binToUuid: binToUuid };module.exports = exports['default'];