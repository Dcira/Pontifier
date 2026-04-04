// reset-password.js
import bcrypt from 'bcrypt';

const newPassword = 'Admin@123';
const hash = await bcrypt.hash(newPassword, 12);
console.log('New hash:', hash);