const express = require('express');
const app = express();
const usersData = require('../src/models/Users.js');

module.exports = {
  name: 'ready',
  execute(client) {
    app.listen(3000);
    console.log(`${client.user.username} Is Online !`);
  },
};