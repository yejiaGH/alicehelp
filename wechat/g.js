'use strict';

var sha1 = require('sha1');
var getRowBody = require('raw-body');
var Wechat = require('./wechat');
var util = require('./util');
// var Promise = require('bluebird');
// var request = Promise.promisify(require('request'));

module.exports = function(opts) {
  var wechat = new Wechat(opts);

  return function *(next) {
    console.log(this.query);
    var that = this;

    var token = opts.token;
    var signature = this.query.signature;
    var nonce = this.query.nonce;
    var timestamp = this.query.timestamp;
    var echostr = this.query.echostr;
    var str = [token, timestamp, nonce].sort().join('')
    var sha = sha1(str);
    
    if (this.method === 'GET') {
      if (sha === signature) {
        this.body = echostr + ' ';
      } else {
        this.body = 'wrong';
      }
    }
    else if (this.method === 'POST') {
      if (sha !== signature) {
        this.body = 'wrong';
        return false;
      }

      var data = yield getRowBody(this.req, {
        length: this.length,
        limit: '1mb',
        encoding: this.charset
      });

      console.log(data.toString());

      var content = yield util.parseXMLAsync(data);
      console.log('parseXML', content);

      var message = util.formatMessage(content.xml);
      console.log('formatMessage-----> ', message);

      // 自动恢复
      if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
          var now = new Date().getTime();

          that.status = 200;
          that.type = 'application/xml';
          var reply = '<xml>' +
          '<ToUserName><![CDATA[' + message.FromUserName + ']]></ToUserName>' +
          '<FromUserName><![CDATA[' + message.ToUserName + ']]></FromUserName>' +
          '<CreateTime>' + now + '</CreateTime>' +
          '<MsgType><![CDATA[text]]></MsgType>' +
          '<Content><![CDATA[欢迎订阅小A帮你忙]]></Content>' +
          '</xml>';

          console.log(reply);
          that.body = reply;

          return;
        }
      }
    }
    
  }
}
