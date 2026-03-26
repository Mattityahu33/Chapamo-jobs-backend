import express from 'express';
import { register, login, logout, getUser } from '../controllers/authControllers.js';  

const router = express.Router();

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', getUser); 







export default router;