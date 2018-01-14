import bcrypt from 'bcrypt';
import async from 'async';
import Users from '../models/users';
import Auth from '../models/auth';
import logger from './logger';
import { admin } from '../config';

export default function () {
  const saltRounds = 10;
  const locals = {};

  async.series([
    // Step 1
    // Insert user admin first
    (callback) => {
      const user = new Users({
        userid: admin.user.userid,
        fullname: admin.user.fullname,
        phone: admin.user.phone,
        email: admin.user.email,
      });

      return user.save((errUser) => {
        if (errUser) {
          if (errUser.code) {
            // Error code if record is available
            if (errUser.code === 11000) {
              callback({
                valid: false,
                message: ['User autentikasi sudah tersedia'],
              });
            }
          } else {
            callback({
              valid: false,
              message: errUser,
            });
          }
        } else {
          locals.user = {
            id: user._id,
            userid: user.userid,
            fullname: user.fullname,
            phone: user.phone,
            email: user.email,
            dateCreated: user.dateCreated,
          };
          callback();
        }
      });
    },

    // Step 2
    // Generate salt
    (callback) => {
      bcrypt.genSalt(saltRounds, (errSalt, salt) => {
        if (errSalt) {
          callback({
            valid: false,
            message: ['Gagal generate salt'],
          });
        } else {
          locals.salt = salt;
          callback();
        }
      });
    },

    // Step 3
    // Bcrypt pasword with salt
    (callback) => {
      bcrypt.hash(admin.auth.password, locals.salt, (errHash, hash) => {
        if (errHash) {
          callback({
            valid: false,
            message: ['Gagal genrate hash'],
          });
        } else {
          locals.hash = hash;
          callback();
        }
      });
    },

    // Step 4
    // Save user auth
    (callback) => {
      const auth = new Auth({
        username: admin.auth.username,
        password: locals.hash,
        plainPassword: admin.auth.password,
        level: admin.auth.level,
        user: locals.user.id,
        status: admin.auth.status,
      });

      return auth.save((errAuth) => {
        if (errAuth) {
          if (errAuth.code) {
            // Error code if record is available
            if (errAuth.code === 11000) {
              callback({
                valid: false,
                message: ['User autentikasi sudah tersedia'],
              });
            }
          } else {
            callback({
              valid: false,
              message: errAuth,
            });
          }
        } else {
          callback({
            valid: true,
            message: 'Berhasil membuat user baru',
            data: {
              userid: locals.user.userid,
              fullname: locals.user.fullname,
              username: auth.username,
              phone: locals.user.phone,
              email: locals.user.email,
              dateCreated: auth.dateCreated,
            },
          });
        }
      });
    },
  ], (result) => {
    logger.info(result);
    return result;
  });
}
