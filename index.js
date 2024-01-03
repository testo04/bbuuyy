const { Client, Collection, EmbedBuilder } = require('discord.js');
const { readdirSync } = require('fs');
const { CLIENT_ID, PREFIX, STOCK_CHANNEL, STOCK_MESSAGE } = require('./src/Constants.js');
const client = new Client({ intents: 3276543 });
const events = readdirSync('events');
const mongoose = require('mongoose');
const DBManager = require('./src/managers/DBManager');
const usersData = require('./src/models/Users.js');
const axios = require('axios');
require('dotenv').config();


client.commands = new Collection();
client.prefix = PREFIX;
client.db = {
  users: new DBManager(usersData) 
};

process.on('unhandledRejection', (err) => console.error(err));
           
mongoose.connection.on('connected', () => console.log('Connected to database !'));
mongoose.connect(process.env.MONGO_URL);

events.filter(e => e.endsWith('.js')).forEach(event => {
  event = require(`./events/${event}`);
  event.once ? client.once(event.name, (...args) => event.execute(...args, client)) : client.on(event.name, (...args) => event.execute(...args, client));
});

events.filter(e => !e.endsWith('js')).forEach(folder => {
  readdirSync('events/' + folder).forEach(event => {
    event = require(`./events/${folder}/${event}`);
    event.once ? client.once(event.name, (...args) => event.execute(...args, client)) : client.on(event.name, (...args) => event.execute(...args, client));
  });
});

for (let folder of readdirSync('commands').filter(folder => !folder.includes('.'))) {
  for (let file of readdirSync('commands/' + folder).filter(f => f.endsWith('.js'))) {    
    const command = require(`./commands/${folder}/${file}`);
    command.category = folder;
    client.commands.set(command.name?.trim().toLowerCase(), command);
  }
}

setInterval(async () => {
  const channel = client.channels.cache.get(STOCK_CHANNEL);
  
  if (channel) {
    const message = await channel.messages.fetch(STOCK_MESSAGE);
  
    if (message) {
      const usersCount = await usersData.countDocuments({ accessToken: { $exists: true } });
      const embed = new EmbedBuilder()
        .setColor('Yellow') 
        .setTitle(`المخزون الحالي هو : ${usersCount}`) 
        .setTimestamp();
    
      message.edit({ embeds: [embed] });
    } 
  }
}, 18e5);

setInterval(async () => {
  const users = await usersData.find({ accessToken: { $exists: true } });
  
  for (const userData of users) {
    try {
      const response = await axios.post('https://discord.com/api/oauth2/token',
        {
          client_id: CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: userData.refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
       });
      
       userData.accessToken = response.data.access_token;
       userData.refreshToken = response.data.refresh_token;

       await userData.save();
      
       console.log(`✅ ${userData.id}`);
     } catch {
       await usersData.findByIdAndRemove(userData._id);
       
       console.log(`❌ ${userData.id}`);
     }
   }
 }, 36e5);

client.login(process.env.TOKEN);
require('./src/Util.js');