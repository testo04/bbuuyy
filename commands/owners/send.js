const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { AUTH_URL } = require('../../src/Constants.js');

module.exports = {
  name: 'send',
  owners: true, 
  async execute(message, args, client) {
    await message.delete()
    let embed = new EmbedBuilder()
                        .setAuthor({name : message.guild.name , iconURL : message.guild.iconURL({dynamic : true})})
                        .setColor('#053b78')
                        .setDescription(`** اثبت نفسك عن طريق الضغط على الزر في الأسفل **`);
     const row = new ActionRowBuilder().addComponents(
       new ButtonBuilder()
       .setStyle(ButtonStyle.Link)
       .setEmoji('<:check:1192153841290985602>')
       .setLabel('اثــبــت نــفــســك')
       .setURL(AUTH_URL));
    message.channel.send({ embeds : [embed] , components: [row] });
  },
};