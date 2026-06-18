import { expect } from 'chai';
import { execute } from '../src/Adaptor.js';
import * as http from '../src/http.js';
import { enableMockClient } from '@openfn/language-common/util';

const baseUrl = 'https://fake.server.com';
const testServer = enableMockClient(baseUrl);

const configuration = {
  baseUrl,
  username: 'hello',
  password: 'there',
};

// Mock /authenticate endpoint
testServer
  .intercept({
    path: '/authenticate',
    method: 'POST',
  })
  .reply(200, { Token: 'fake-token' })
  .persist();

describe('http.post', () => {
  it('makes a post request to the right endpoint', async () => {
    testServer
      .intercept({
        path: '/api/patients',
        method: 'POST',
        headers: {
          Authorization: 'Bearer fake-token',
        },
      })
      .reply(200, { id: 7, fullName: 'Mamadou', gender: 'M' });

    const state = {
      configuration,
      data: {
        fullName: 'Mamadou',
        gender: 'M',
      },
    };

    const finalState = await execute(
      http.post('api/patients', {
        name: state.data.fullName,
        gender: state.data.gender,
      })
    )(state);

    expect(finalState.data).to.eql({
      fullName: 'Mamadou',
      gender: 'M',
      id: 7,
    });
  });

  it('throws an error if the service returns 403', async () => {
    testServer
      .intercept({
        path: '/api/noAccess',
        method: 'POST',
      })
      .reply(403);

    const state = {
      configuration,
    };

    const error = await execute(
      http.post('api/noAccess', { name: 'taylor' })
    )(state).catch(error => {
      return error;
    });

    expect(error.statusMessage).to.eql('Forbidden');
  });
});
