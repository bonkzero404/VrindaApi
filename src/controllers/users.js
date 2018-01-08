import bcrypt from 'bcrypt';
import async from 'async';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import {generatePassword} from '../utils/random';
import Users from '../models/users';
import Auth from '../models/auth';
import {adduser} from '../mqtt-server';
import {basic} from '../config';

/////////////////////////////// Register User /////////////////////////////
export const registerUser = (req, res) => {
  const request = req.body;
  const locals = {};
  const errors = [];

  // Triger user if level user = user Can insert only level administrator or
  // manager
  if (req.decoded.level === 'user') 
    return res.json({valid: false, messages: ['Anda tidak mempunyai izin akses untuk menambahkan pengguna']});
  
  // Generate random password
  let genPassword = generatePassword({length: basic.apiServer.generatePasswordLength, numbers: true, uppercase: true, symbols: false});

  // User ID Validator (empty, numeric)
  if (request.userid === undefined || validator.isEmpty(request.userid)) 
    errors.push('User ID harus diisi');
  if (!validator.isNumeric(request.userid)) 
    errors.push('User ID harus berupa angka');
  if (!validator.isLength(request.userid, {min: 16})) 
    errors.push('User ID minimal harus 16 digit');
  
  // Fullname validator(empty)
  if (request.fullname === undefined || validator.isEmpty(request.fullname)) 
    errors.push('Nama lengkap harus diisi');
  
  // Phone validator (empty, numeric)
  if (request.phone === undefined || validator.isEmpty(request.phone)) 
    errors.push('Nomor telepon harus diisi');
  if (!validator.isNumeric(request.phone)) 
    errors.push('Nomor telepon harus berupa angka');
  
  // Email validator (empty, email format)
  if (request.email === undefined || validator.isEmpty(request.email)) 
    errors.push('Email harus diisi');
  if (!validator.isEmail(request.email)) 
    errors.push('Format email salah, contoh: nama@domain.id');
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  async.series([
    // Step 1 Save user account
    (callback) => {
      const user = new Users({
        userid: request.userid,
        fullname: request.fullname,
        phone: request.phone,
        email: request.email,
        level: (req.decoded.level === 'administrator' && request.level !== undefined
          ? request.level
          : 'user')
      });

      return user.save((errUser) => {
        if (errUser) {
          if (errUser.code) {
            // Error code if record is available
            if (errUser.code === 11000) {
              callback({valid: false, messages: ['Pengguna sudah terdaftar']});
            }
          } else {
            callback({valid: false, messages: errUser});
          }
        } else {
          locals.user = {
            id: user._id,
            userid: user.userid,
            fullname: user.fullname,
            phone: user.phone,
            email: user.email
          };
          callback();
        }
      });
    },

    // Step 2 Create Salt Password
    (callback) => {
      bcrypt.genSalt(basic.apiServer.saltRounds, (errSalt, salt) => {
        if (errSalt) {
          callback({valid: false, messages: ['Gagal generate salt']});
        } else {
          locals.salt = salt;
          callback();
        }
      });
    },

    // Step 3 Bcrypt password with salt
    (callback) => {
      bcrypt.hash(genPassword, locals.salt, (errHash, hash) => {
        if (errHash) {
          callback({valid: false, messages: ['Gagal generate hash']});
        } else {
          locals.hash = hash;
          callback();
        }
      });
    },

    // Step 4 Save auth user to database
    (callback) => {
      const auth = new Auth({username: locals.user.userid, password: locals.hash, plainPassword: genPassword, user: locals.user.id});

      return auth.save((errAuth) => {
        if (errAuth) {
          if (errAuth.code) {
            // Error code if record is available
            if (errAuth.code === 11000) {
              callback({valid: false, messages: ['Pengguna sudah terdaftar dalam database']});
            }
          } else {
            callback({valid: false, messages: errAuth});
          }
        } else {
          callback({
            valid: true,
            messages: 'Data pengguna berhasil dibuat, mohon menunggu konfirmasi',
            data: {
              userid: locals.user.userid,
              fullname: locals.user.fullname,
              phone: locals.user.phone,
              email: locals.user.email
            }
          });
        }
      });
    }
  ], (result) => {
    res.json(result);
  });
};

// ///////////////////////////// User Authentication
// /////////////////////////////
export const userAuth = (req, res) => {
  const user = req.body.username;
  const password = req.body.password;
  const locals = {};
  const errors = [];

  if (user === undefined || validator.isEmpty(user)) 
    errors.push('Username tidak boleh kosong');
  if (password === undefined || validator.isEmpty(password)) 
    errors.push('Username tidak boleh kosong');
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  async.series([
    // Step 1 Find user by username
    (callback) => {
      Auth
        .findOne({username: user})
        .populate('user')
        .exec((err, doc) => {
          if (err) {
            callback({valid: false, messages: err});
          } else {
            if (doc === null) {
              callback({valid: false, messages: ['Username not registered']});
            } else {
              if (doc.status === 'active') {
                locals.doc = doc;
                callback();
              } else {
                res.json({valid: false, messages: ['Akun belum di aktivasi, masih menunggu persetujuan admin']});
              }
            }
          }
        });
    },

    // Step 2 compare bcrypt
    (callback) => {
      try {
        bcrypt.compare(password, locals.doc.password, (errBcrypt, resBcrypt) => {
          if (errBcrypt) {
            callback({valid: false, messages: errBcrypt});
          } else if (resBcrypt === true) {
            callback();
          } else {
            callback({valid: false, messages: ['User atau password tidak cocok']});
          }
        });
      } catch (e) {
        callback({valid: false, messages: ['User atau password tidak cocok']});
      }
    },

    // Step 3 Generate token and fetch data
    (callback) => {
      jwt.sign(locals.doc.toObject(), basic.apiServer.jwtSecret, {
        algorithm: 'HS512',
        expiresIn: '1d'
      }, (err, token) => {
        if (err) {
          callback({valid: false, messages: ['Gagal menggenerate token']});
        } else {
          callback({
            valid: true,
            messages: ['Data pengguna berhasil dimuat'],
            data: {
              fullname: locals.doc.user.fullname,
              username: locals.doc.user.username,
              phone: locals.doc.user.phone,
              email: locals.doc.user.email,
              accessToken: token
            }
          });
        }
      });
    }
  ], (result) => {
    res.json(result);
  });
};

/////////////////////////////// Updata Status /////////////////////////////
export const updateStatusByUsername = (req, res) => {
  const request = req.body;
  const errors = []
  const locals = {};

  // Triger user if level user = user Can insert only level administrator or
  // manager
  if (req.decoded.level === 'user') 
    return res.json({valid: false, messages: ['Anda tidak mempunyai izin akses untuk menambahkan pengguna']});
  
  if (request.username === undefined || validator.isEmpty(request.username)) 
    errors.push('Username tidak boleh kosong');
  if (request.status === undefined || validator.isEmpty(request.status)) 
    errors.push('Status tidak boleh kosong');
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  async.series([
    // Step 1 Find user by username
    (callback) => {
      Auth
        .findOne({username: request.username})
        .populate('user')
        .exec((err, doc) => {
          if (err) {
            callback({valid: false, messages: err});
          } else {
            if (doc === null) {
              callback({valid: false, messages: ['Pengguna belum teregistrasi']});
            } else {
              if (doc.status === 'approval' || doc.status === 'suspend') {
                locals.doc = doc;
                callback();
              } else {
                res.json({valid: false, messages: ['Akun sudah di aktifasi']});
              }
            }
          }
        });
    },

    // Step 2 Update status by username
    (callback) => {
      Auth.update({
        username: locals.doc.username
      }, {
        $set: {
          status: request.status
        }
      }, (err, doc) => {
        if (err) {
          callback({valid: false, messages: err});
        } else {
          callback({
            valid: true,
            messages: ['Data status pengguna berhasil di aktifasi'],
            data: {
              fullname: locals.doc.user.fullname,
              username: locals.doc.username,
              phone: locals.doc.user.phone,
              email: locals.doc.user.email
            }
          });
        }
      });
    }
  ], (result) => {
    res.json(result);
  });
}

// ///////////////////////////// Load data from session
// /////////////////////////////
export const me = (req, res) => {
  res.json({
    valid: true,
    messages: ['Data pengguna berhasil dimuat'],
    data: {
      _id: req.decoded._id,
      _userid: req.decoded.user._id,
      userid: req.decoded.user.userid,
      username: req.decoded.username,
      fullname: req.decoded.user.fullname,
      phone: req.decoded.user.phone,
      email: req.decoded.user.email,
      status: req.decoded.status,
      iat: req.decoded.iat,
      exp: req.decoded.exp
    }
  });
}
