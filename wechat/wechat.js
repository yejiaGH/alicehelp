'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
  access_token: prefix + 'token?grant_type=client_credential'
};

// var config = {
//   wechat: {
//     appID: 'wxb32d7aa4f2d1d441',
//     appSecret: '0f02ac3c7212ec176006d9bb1e5d16a3',
//     token: 'alicehelp'
//   }
// }

function Wechat(opts) {
  var that = this;
  this.appID = opts.appID;
  this.appSecret = opts.appSecret;
  this.getAccessToken = opts.getAccessToken;
  this.saveAccessToken = opts.saveAccessToken;

  this.getAccessToken()
    .then(function(data) {
      console.log('getAccessToken: data = ' + data);
      try {
        data = JSON.parse(data);
      } catch(e) {
        console.log('access_token read error');
        return that.updateAccessToken();
      }

      if (that.isValidAccessToken(data)) {
        console.log('valid');
        return Promise.resolve(data);
      } else {
        console.log('invalid');
        return that.updateAccessToken();
      }
    })
    .then(function(data) {
      console.log('to save data : data = ' + JSON.stringify(data));
      that.access_token = data.access_token;
      that.expires_in = data.expires_in;

      that.saveAccessToken(data);
    });
}

Wechat.prototype.isValidAccessToken = function(data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false;
  }

  var access_token = data.access_token;
  var expires_in = data.expires_in;
  var now = (new Date().getTime());

  if (now < expires_in) {
    return true;
  } else {
    return false;
  }
}

Wechat.prototype.updateAccessToken = function() {
  var appID = this.appID;
  var appSecret = this.appSecret;
  var url = api.access_token + '&appid=' + appID + '&secret=' + appSecret;

  return new Promise(function(resolve, reject) {
    request({url: url, json: true}).then(function(response) {
      console.log('updateAccessToken: response = ' + JSON.stringify(response));
      var data = response['body'];
      var now = (new Date().getTime());
      var expires_in = now + (data.expires_in - 20) * 1000
  
      data.expires_in = expires_in;
      
      resolve(data);
    });
  });  
}

module.exports = Wechat;