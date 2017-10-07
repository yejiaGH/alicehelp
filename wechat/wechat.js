'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
  access_token: prefix + 'token?grant_type=client_credential',
  upload: prefix + 'media/upload?'
};

// var config = {
//   wechat: {
//     appID: 'wxb32d7aa4f2d1d441',
//     appSecret: '0f02ac3c7212ec176006d9bb1e5d16a3',
//     token: 'alicehelp'
//   }
// }

function Wechat(opts) {
  this.appID = opts.appID;
  this.appSecret = opts.appSecret;
  this.getAccessToken = opts.getAccessToken;
  this.saveAccessToken = opts.saveAccessToken;

  this.fetchAccessToken();
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

Wechat.prototype.fetchAccessToken = function() {
  var that = this;

  if (this.access_token && this.expires_in) {
    if (this.isValidAccessToken(this)) {
      return Promise.resolve(this);
    }
  }

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

    return Promise.resolve(data);
  });
}

Wechat.prototype.uploadMaterial = function(type, filepath) {
  var that = this;
  var form = {
    media: fs.createReadStream(filepath)
  };

  return new Promise(function(resolve, reject) {
    that
    .fetchAccessToken()
    .then(function(data) {
      
      var url = api.upload + 'access_token=' + data.access_token + '&type=' + type;

      request({method: 'POST', url: url, formData: form, json: true}).then(function(response) {
        console.log('upload response======>', JSON.stringify(response));
  
        var _data = response['body'];
  
        if (_data) {
          resolve(_data);
        } else {
          throw new Error('Upload aterial fails');
        }
      })
      .catch(function(err) {
        reject(err);
      });
    });
  });
}

Wechat.prototype.reply = function() {
  var content = this.body;
  var message = this.weixin;
  var xml = util.tpl(content, message);

  this.status = 200;
  this.type = 'application/xml';
  this.body = xml;
}

module.exports = Wechat;