/**
 * Customer.js
 *
 * @author: Harish Anchu <harishanchu@gmail.com>
 * @copyright Copyright (c) 2018, Harish Anchu.
 * @license See LICENSE
 */
'use strict';

module.exports = function (Customer) {

  /* -------------------------
   *  API's
   * -------------------------
   */

  /**
   * Override default loopback login method to implement application
   * custom logic
   */
  Customer.login = function (credentials, fn) {
    this.super_.login.call(this, credentials, 'user', function (err, token) {
      // Default response token attribute name is id; we
      // will rename it here to accessToken. We will remove
      // userId attribute since user information object already
      // contains it.
      if (token) {
        token = token.toJSON();
        token.accessToken = token.id;
        delete token.id;
        delete token.userId;
      }

      fn(err, token);
    });
  };

  /**
   * Add a role to the user
   * @param {string} userId
   * @param {string} roleName Role to be assigned to the user
   * @param {Function} callback
   */

  Customer.addRole = function (userId, roleName, callback) {
    Customer.findById(userId, function (err, user) {
      if (err) {
        return callback(err);
      } else if(!user) {
        let err = new Error(g.f('User not found'));
        err.statusCode = 400;
        err.code = 'USER_NOT_FOUND';

        return callback(err);
      }
      else {
        const Role = Customer.app.models.Role;
        const RoleMapping = Customer.app.models.RoleMapping;

        Role.upsertWithWhere(
          {
            name: roleName
          },
          {
            name: roleName
          },
          function (err, role) {
            if (err) {
              callback(role);
            } else {
              // Assign role to the user
              RoleMapping.upsertWithWhere(
                {
                  principalId: user.id,
                  principalType: RoleMapping.USER,
                  roleId: role.id
                }, {
                  principalId: user.id,
                  principalType: RoleMapping.USER,
                  roleId: role.id
                }, function (err) {
                  callback(err);
                })
            }
          }
        )
      }
    });
  };

  /* ---------------------------------
   * Override remote methods
   * --------------------------------
   */

  /**
   * Modify login API
   */
  let loginRemoteMethod = Customer.sharedClass.findMethodByName('login');

  loginRemoteMethod.accepts = [
    {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
  ];
  loginRemoteMethod.returns = [{
    arg: 'body', type: 'object', root: true
  }];

  /**
   * Modify logout API http verb from the default.
   */
  Customer.sharedClass.findMethodByName('logout').http.verb = "delete";

  /**
   * Modify change password API http verb from the default.
   */
  Customer.sharedClass.findMethodByName('changePassword').http.verb = 'put';

  /**
   * Modify reset password API http verb from the default.
   */
  Customer.sharedClass.findMethodByName('setPassword').http.verb = 'put';

  /* ---------------------------------
   * Remote methods
   * --------------------------------
   */
  Customer.remoteMethod('addRole', {
    'accepts': [
      {
        arg: 'id',
        type: 'any',
        description: 'User id whose role is to be updated',
        required: true,
        http: {source: 'path'}
      },
      {
        'arg': 'roleName',
        'type': 'string',
        'required': true,
        'description': 'Role to be added to the user',
        'http': {
          'source': 'form'
        }
      }
    ],
    'description': 'Add a role to the user',
    'http': [
      {
        'path': '/:id/role',
        'verb': 'post'
      }
    ]/*,
    accessScopes: ['EXECUTE']*/
  });


  /* --------------------------------------------
   * Disable relational remote methods
   * -------------------------------------------
   * Its not possible to disable them from model
   * json config
   */
  /*Customer.disableRemoteMethodByName('prototype.__count__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__create__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__delete__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__findById__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__get__accessTokens');
  Customer.disableRemoteMethodByName('prototype.__updateById__accessTokens');*/
};
