const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { BOT_URL } = require("../../src/Constants.js");

module.exports = {
  name: "panel",
  owners: true,
  async execute(message, args, client) {
    await message.delete();
    const embed = new EmbedBuilder()
      .setTitle("بنل التحكم")
      .setColor("#053b78")
      .setImage(
        "https://media.discordapp.net/attachments/1191423644606410863/1192151971528970281/29d3e0ffba6fc079_27_4_1.png?ex=65a8090b&is=6595940b&hm=7091d2a3e3eb93709a788a023e9dfde431ef21978124d5d146f021bb9735cde0&=&format=webp&quality=lossless&width=1161&height=387"
      )
      .setDescription(
        "** > عن طريق هذه البانل ، يمكنك : \n - شراء رصيد \n - شراء اعضاء \n - ادخال البوت لشراء اعضاء**"
      )
      .setThumbnail(message.guild.iconURL({dynamic : true}))
      .setAuthor({name : message.guild.name , iconURL : message.guild.iconURL({dynamic : true})});

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("buy-balance")
      .setEmoji("<:money:1192153435005522021>")
      .setLabel("شراء رصيد"),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("withdraw-m-balance")
        .setEmoji("<:user:1192153432333762560>")
        .setLabel("شراء أعضاء"),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(BOT_URL)
        .setEmoji("<:link:1192153428735053906>")
        .setLabel("إدخال البوت")
    );

    message.channel.send({ embeds: [embed], components: [row] });
    message.delete();
  },
};
