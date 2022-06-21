const msal = require('@azure/msal-node');

const config = {
  auth: {
    clientId: 'eef01992-b105-4011-ba15-b8591171fef8',
    authority: 'https://login.microsoftonline.com/common/',
    clientSecret: 'wNl8Q~tKe5a~EG0bxuBJCpBlGQi_h2jnr~y5aaF2',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    },
  },
};

module.exports = config;
