import express from 'express';
import { registerUser, userAuth, updateStatusByUsername, me } from '../controllers/users';
import jwt from '../utils/jwt';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/auth').post(userAuth);
router.route('/register').post(jwt, registerUser);
router.route('/status').put(jwt, updateStatusByUsername);
router.route('/me').get(jwt, me);

export default router;
