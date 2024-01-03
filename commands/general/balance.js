const usersData = require('../../src/models/Users.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'balance',
  async execute(message, args, client) {
    const user = args[0] ? client.users.cache.get(args[0]?.toId()) : message.author;
    
    if (!user) return message.lineReplyNoMention('❌ **هذا المستخدم غير موجود!**');
    if (user.bot) return message.lineReplyNoMention('❌ **البوتات لا تملك ارصدة!**');
    
    const userData = await usersData.findOne({ id: user.id }) || new usersData({ id: user.id });
    const embed = new EmbedBuilder()
      .setColor('#053b78') 
      //.setImage("https://media.discordapp.net/attachments/1172443522331312208/1172494909656289320/20231110_023806.jpg?ex=656085fa&is=654e10fa&hm=175a430a6904fd1c17d9676e82d510d1028486fe0f0a1c118388bcdfd0f132bd&")
      .setAuthor({name : message.guild.name , iconURL : message.guild.iconURL({dynamic : true})})
      .setDescription(user.id === message.author.id ? `** > رصيدك الحالي هو : \`${userData.balance}\`**` : `** > رصيد ${user.username} الحالي هو : \`${userData.balance}\`**`)
      .setTimestamp();
    
    message.lineReplyNoMention({ embeds: [embed] });
  },
};
