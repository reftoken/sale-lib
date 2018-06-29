'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.generateShortId = undefined;var _ethereumjsUtil = require('ethereumjs-util');var _ethereumjsUtil2 = _interopRequireDefault(_ethereumjsUtil);
var _base = require('base-58');var _base2 = _interopRequireDefault(_base);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

/**
                                                                                                                                                                         * Deterministically generates shortId from given investorId and merchantId
                                                                                                                                                                         * @param {(string|Buffer)} investorId - investor id
                                                                                                                                                                         * @param {(string|Buffer)} merchantId - first 8 bytes of merchant id
                                                                                                                                                                         * @returns {string} short id (7 chars)
                                                                                                                                                                         */
var generateShortId = exports.generateShortId = function generateShortId(investorId, merchantId) {
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