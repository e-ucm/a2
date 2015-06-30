'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({
    user: {
      id: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
      },
      name: { 
        type: String, 
        required: true,
        default: '' 
      }
    },
    name: {
      first: { 
        type: String, 
        default: '' 
      },
      middle: { 
        type: String, 
        default: '' 
      },
      last: { 
        type: String, 
        default: '' 
      }
    },
    verification: {
      complete: {
        type: Boolean
      },
      token: {
        type: String
      }
    },
    timeCreated: { 
      type: Date, 
      default: Date.now 
    }
  });
  accountSchema.statics.create = function (userId, username, name, callback) {

      var nameParts = name.trim().split(/\s/);

      var document = {
          name: {
              first: nameParts.shift(),
              middle: nameParts.length > 1 ? nameParts.shift() : undefined,
              last: nameParts.join(' ')
          },
          user : {
              id : userId,
              name :  username
          },
          timeCreated: new Date()
      };

      var AccountModel = app.db.model('account');
      var account = new AccountModel(document);
      account.save(function(err, result) {
          if(err) {
              return callback(err);
          }
          console.log(result);

          callback(null, result);
      });
  };
  accountSchema.statics.findByUsername = function (username, callback) {

      var query = { 'user.name': username.toLowerCase() };
      app.db.model('account').findOne(query, callback);
  };
  accountSchema.plugin(require('./plugins/pagedFind'));
  accountSchema.index({ 'user.id': 1 });
  accountSchema.index({ 'user.name': 1 });
  accountSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('account', accountSchema);
};
