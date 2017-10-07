'use strict';

var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt');

var config = {
  wechat: {
    appID: 'wxb32d7aa4f2d1d441',
    appSecret: '0f02ac3c7212ec176006d9bb1e5d16a3',
    token: 'alicehelp',
    getAccessToken: function() {
      return util.readFileAsync(wechat_file)
    },
    saveAccessToken: function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_file, data)
    }
  }
}

module.exports = config;