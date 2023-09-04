'use strict';

const axios = require('axios');

function allSettled (promises) {
  const wrappedPromises = promises.map(p => Promise.resolve(p)
    .then(
      val => ({ state: 'fulfilled', value: val }),
      err => ({ state: 'rejected', reason: err })
    )
  );

  return Promise.all(wrappedPromises);
}

function getEndpoint (healthCheck) {
  let uri = `${healthCheck.protocol}://${healthCheck.host}`;

  if (healthCheck.port) {
    uri += `:${healthCheck.port}`;
  }

  uri += healthCheck.path;
  return uri
}


module.exports = async healthChecks => {
  const checkPromises = [];

  (healthChecks || []).forEach(healthCheck => {
    let uri = `${healthCheck.protocol}://${healthCheck.host}`;

    if (healthCheck.port) {
      uri += `:${healthCheck.port}`;
    }

    uri += healthCheck.path;

    checkPromises.push(axios({
      url: uri,
      method: 'GET',
      timeout: 10000,
      headers: healthCheck.headers
    }));
  });

  const checkResults = [];

  return allSettled(checkPromises).then(results => {
    results.forEach((result, index) => {
      const fullPath = getEndpoint(healthChecks[index])

      if (result.state === 'rejected') {
        checkResults.push({
          path: healthChecks[index].path,
          endpoint: fullPath,
          status: 'failed'
        });
      } else {
        checkResults.push({
          path: healthChecks[index].path,
          endpoint: fullPath,
          status: 'ok'
        });
      }
    });

    return checkResults;
  });
};
