import express from 'express';
import { commandOnOff } from '../controllers/command';
import jwt from '../utils/jwt';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/cmd').post(jwt, commandOnOff);

export default router;
