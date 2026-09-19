import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { loginAdmin } from './helpers/adminLogin.js';
import { loginUser } from './helpers/userLogin.js';

import testData from './data/testData.json' with { type: 'json' };

describe('Fluxo de gestão do aluno', () => {
  let adminToken;

  before(async () => {
    adminToken = await loginAdmin();

    expect(adminToken).to.exist;
  });

  for (const aluno of testData.alunos) {
    describe(`Fluxo do aluno: ${aluno.nome}`, () => {
      let alunoId;
      let alunoToken;

      it('deve cadastrar o aluno', async () => {
        const resposta = await request(app)
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(aluno);

        expect(resposta.status).to.equal(201);

        expect(resposta.body).to.have.property('id');
        expect(resposta.body.nome).to.equal(aluno.nome);
        expect(resposta.body.email).to.equal(aluno.email);
        expect(resposta.body.matricula).to.equal(aluno.matricula);

        alunoId = resposta.body.id;
      });

      it('deve matricular o aluno em uma disciplina', async () => {
        const resposta = await request(app)
          .post(
            `/api/admin/disciplinas/${testData.disciplina.id}/matriculas`
          )
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            alunoId
          });

        expect(resposta.status).to.equal(201);

        expect(resposta.body.alunoId).to.equal(alunoId);
        expect(resposta.body.disciplinaId)
          .to.equal(testData.disciplina.id);
      });

      it('deve permitir o login do aluno', async () => {
        alunoToken = await loginUser(
          aluno.email,
          aluno.senha
        );

        expect(alunoToken).to.exist;
      });

      it('deve registrar a entrega do trabalho como aluno', async () => {
        const resposta = await request(app)
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${alunoToken}`)
          .send({
            disciplinaId: testData.disciplina.id,
            titulo: testData.trabalho.titulo,
            descricao: testData.trabalho.descricao
          });

        expect(resposta.status).to.equal(201);

        expect(resposta.body).to.have.property('id');
        expect(resposta.body.alunoId).to.equal(alunoId);
        expect(resposta.body.disciplinaId)
          .to.equal(testData.disciplina.id);
        expect(resposta.body.titulo)
          .to.equal(testData.trabalho.titulo);
        expect(resposta.body.status).to.equal('entregue');
      });

      after(async () => {
        if (alunoId) {
          await request(app)
            .delete(`/api/admin/alunos/${alunoId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        }
      });
    });
  }

});