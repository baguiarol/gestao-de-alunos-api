import 'dotenv/config';
import request from 'supertest';
import app from '../../src/app.js';

export async function loginAdmin() {
  const resposta = await request(app)
    .post('/api/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL,
      senha: process.env.ADMIN_PASSWORD
    });

  return resposta.body.token;
}