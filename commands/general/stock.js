const usersData = require('../../src/models/Users.js');
const { EmbedBuilder , Client , Message } = require('discord.js');

module.exports = {
  name: 'stock',
      /**
     * @param {Message} message
     * @param {Client} client
     */
  async execute(message, args, client) {
    const usersCount = await usersData.countDocuments({ accessToken: { $exists: true } });
    const embed = new EmbedBuilder()
      .setColor('#053b78') 
      .setImage("https://media.discordapp.net/attachments/1191423644606410863/1191711360111890452/29d3e0ffba6fc079_27_3.png?ex=65a66eb1&is=6593f9b1&hm=4f53c9b8f9fdf5988e57bc91c49be93f13ab628a1553b4639b638da23e93ee63&=&format=webp&quality=lossless&width=1161&height=387")
      .setAuthor({name : message.guild.name , iconURL : message.guild.iconURL({dynamic : true})})
      .setThumbnail(message.guild.iconURL({dynamic : true}))
      .setDescription(`** > المخزون الحالي هو : \`${usersCount}\` **`)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  },
};