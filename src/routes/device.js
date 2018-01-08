import express from 'express';
import { deviceLists, updateDeviceLabel } from '../controllers/device';
import jwt from '../utils/jwt';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/list').get(jwt, deviceLists);
router.route('/label').put(jwt, updateDeviceLabel);

export default router;
