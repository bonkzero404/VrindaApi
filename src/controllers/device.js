import async from 'async';
import validator from 'validator';
import Device from '../models/device';
import Auth from '../models/auth';

export const deviceLists = (req, res) => {
  const request = req.params;
  const locals = {};
  const errors = [];

  if (req.decoded.level === 'administrator' || req.decoded.level === 'manager') 
    return res.json({valid: false, messages: ['Anda tidak mempunyai izin akses untuk melihat perangkat lists']});
  
  if (req.decoded.status !== 'active') 
    return res.json({valid: false, messages: ['Pengguna belum aktif']});
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  Device
    .find({user: req.decoded._id})
    .select('deviceid devicelabel online')
    .exec((err, doc) => {
      if (err) {
        res.json({valid: false, messages: err});
      } else {
        if (doc === null) {
          res.json({valid: false, messages: ['Tidak ada perangkat yang terdaftar']});
        } else {
          res.json({
            valid: true,
            messages: ['Data perangkat berhasil dimuat'],
            data: {
              username: req.decoded.username,
              fullname: req.decoded.user.fullname,
              devices: doc
            }
          });
        }
      }
    });
};

export const updateDeviceLabel = (req, res) => {
  const request = req.body;
  const errors = [];

  if (req.decoded.level === 'administrator' || req.decoded.level === 'manager') 
    return res.json({valid: false, messages: ['Anda tidak mempunyai izin akses untuk menghidupkan atau mematikan perangkat']});
  
  if (req.decoded.status !== 'active') 
    return res.json({valid: false, messages: ['Pengguna belum aktif']});
  
  if (request.deviceId === undefined || validator.isEmpty(request.deviceId)) 
    errors.push('Device ID harus diisi');
  if (request.label === undefined || validator.isEmpty(request.label)) 
    errors.push('Device label harus diisi');
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  Device.findOneAndUpdate({
    deviceid: request.deviceId,
    user: req.decoded._id
  }, {
      $set: {
        devicelabel: request.label
      }
    })
    .select('deviceid devicelabel online')
    .exec((err, doc) => {
      if (err) {
        res.json({valid: false, messages: err});
      } else {
        if (doc === null) {
          res.json({valid: false, messages: ['Perangkat belum terdaftar']});
        } else {
          res.json({
            valid: true,
            messages: [`Perangkat label ${doc.deviceid} berhasil diubah`],
            data: doc
          })
        }
      }
    });
};
