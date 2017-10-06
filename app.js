'use strict'

var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/g');
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

var app = new Koa();

app.use(wechat(config.wechat));

app.listen(1234);
console.log('Listening: 1234');