import bcrypt from "bcrypt";

const MIN_ROUNDS = 12;

export function getRounds() {
  const n = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  return n >= MIN_ROUNDS ? n : MIN_ROUNDS;
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, getRounds());
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function generateTempPassword() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Jkuat${n}!`;
}
