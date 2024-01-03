const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MIN_MEMBERS, BALANCE_PRICE, RECIPIENT_ID, TRANSACTIONS_CHANNEL, PROBOT_IDS, CLIENTS_ROLE, SUPERCLIENTS_ROLE, BALANCE_LOG, DONE_CHANNEL } = require('../src/Constants.js');
const cooldowns = new Map();
const mCooldowns = new Map();
const m2Cooldowns = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isButton()) {
      if (interaction.customId === 'buy-balance') {
        if (cooldowns.has(interaction.user.id)) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('cancel-buy')
            .setStyle(ButtonStyle.Danger)
            .setLabel('إنهاء عملية الشراء'));

          interaction.reply({
            content: '✖️ **عذرا ولاكن لديك عملية شراء لم يتم إكمالها**',
            components: [row],
            ephemeral: true,
          });
        } else {
          if (m2Cooldowns.has(interaction.user.id)) return interaction.reply({
            content: '✖️ **يرجى الإنتظار حتى إنتهاء العملية الحاليا**',
            ephemeral: true
          });

          const modal = new ModalBuilder()
            .setCustomId('balance-modal')
            .setTitle('Buy Balance');

          const amount = new TextInputBuilder()
            .setCustomId('amount')
            .setMinLength(1)
            .setPlaceholder('Ex: 50')
            .setStyle(TextInputStyle.Short)
            .setLabel('الكمية');

          const row = new ActionRowBuilder().addComponents(amount);

          modal.addComponents(row);
          interaction.showModal(modal);
        }
      }

      if (interaction.customId === 'cancel-buy' && cooldowns.has(interaction.user.id)) {
        await cooldowns.delete(interaction.user.id);

        interaction.reply({
          content: '✔️ **تم بنجاح! إنهاء عملية الشراء**',
          ephemeral: true
        });
      }

      if (interaction.customId === 'withdraw-m-balance' && !mCooldowns.has(interaction.user.id)) {
        if (cooldowns.has(interaction.user.id)) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('cancel-buy')
            .setStyle(ButtonStyle.Danger)
            .setLabel('إنهاء عملية الشراء'));

          interaction.reply({
            content: '✖️ **عذرا ولاكن لديك عملية شراء لم يتم إكمالها**',
            components: [row],
            ephemeral: true,
          });
        } else {
          if (m2Cooldowns.has(interaction.user.id)) return interaction.reply({
            content: '✖️ **يرجى الإنتظار حتى إنتهاء العملية الحاليا**',
            ephemeral: true
          });

          const modal = new ModalBuilder()
            .setCustomId('members-modal')
            .setTitle('Buy Members');

          const amount = new TextInputBuilder()
            .setCustomId('amount')
            .setMinLength(1)
            .setPlaceholder('Ex: 50')
            .setStyle(TextInputStyle.Short)
            .setLabel('الكمية');

          const id = new TextInputBuilder()
            .setCustomId('id')
            .setMinLength(1)
            .setPlaceholder('Ex: 1151650671884517447')
            .setStyle(TextInputStyle.Short)
            .setLabel('معرف الخادم (Server ID)');

          const row = new ActionRowBuilder().addComponents(amount);
          const row1 = new ActionRowBuilder().addComponents(id);

          modal.addComponents(row, row1);
          interaction.showModal(modal);
        }

      }
      if (interaction.customId === 'cancel-m' && mCooldowns.get(interaction.user.id)?.messageId === interaction.message.id) {
        await mCooldowns.delete(interaction.user.id);

        interaction.reply({
          content: '✔️ **تم إلغاء العملية بنجاح!**',
          ephemeral: true
        });
      }

      if (interaction.customId.startsWith('join') && mCooldowns.get(interaction.user.id)?.messageId === interaction.message.id) {
        const members = mCooldowns.get(interaction.user.id).members;

        mCooldowns.delete(interaction.user.id);

        let done = 0,
          failed = 0;

        const userData = await client.db.users.patch(interaction.user.id);

        const [, ID, COUNT] = interaction.customId.split('-');
        const guild = client.guilds.cache.get(ID);

        if (!guild) return interaction.reply({
          content: '✖️ **يجب إدخال البوت الي هذا الخادم!**',
          ephemeral: true,
        });

        const msg = await interaction.reply({
          content: '**جاري الإدخال ..**',
          ephemeral: true
        });

        userData.balance -= +COUNT;
        await userData.save();

        await m2Cooldowns.set(interaction.user.id);

        for (const member of members) {
          const userId = member.id;
          const accessToken = member.accessToken;
          const members = guild.members;

          if (members.cache.get(userId)) {
            continue;
          }

          try {
            await members.add(userId, {
              accessToken
            });
            done++;
          } catch {
            failed++;
          }
        }

        m2Cooldowns.delete(interaction.user.id);

        if (COUNT - done > 0) {
          userData.balance += COUNT - done;

          await userData.save();
        }

        if (done > 0) {
          msg.edit(`✔️ **تم بنجاح! إدخال ${done} عضو**`);

          const doneChannel = client.channels.cache.get(DONE_CHANNEL);

          if (doneChannel) {
            const embed = new EmbedBuilder()
              .setColor('Yellow')
              .setDescription(`**تم شراء \`${done}\` عضو بواسطة : ${interaction.user}**`)
              .setTimestamp();

            doneChannel.send({
              embeds: [embed]
            });
          }
        } else {
          msg.edit(`✖️ **فشل الإدخال!**`);
        }
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'balance-modal') {
        let ended = false;

        const amount = +interaction.fields.getTextInputValue('amount');

        if (!amount.isNumber()) return interaction.reply({
          content: '✖️ **هذا العدد غير صحيح!**',
          ephemeral: true
        });

        const price = Math.floor(amount * BALANCE_PRICE);
        const fullPrice = price === 1 ? 1 : Math.ceil(price / 0.95);

        const channel = client.channels.cache.get(TRANSACTIONS_CHANNEL);
        const embed = new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('الرجاء التحويل لإكمال عملية الشراء')
          .setDescription(`\`\`\`#credit ${RECIPIENT_ID} ${fullPrice}\`\`\`\n**لديك 5 دقائق فقط لإكمال عملية التحويل\nالتحويل يكون في روم ${channel}**`)
          .setTimestamp();

        const mention = await channel.send(`${interaction.user}`);
        setTimeout(() => mention.delete(), 2000);

        const msg = await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });

        await cooldowns.set(interaction.user.id, {
          messageId: msg.id
        });
        const filter = message => PROBOT_IDS.includes(message.author.id) && message.content.includes(`${price}`) & message.content.includes(`${RECIPIENT_ID}`) && message.content.includes(`${interaction.user.username}`);
        const pay = await channel.createMessageCollector({
          filter,
          max: 1,
          time: 3e5
        });

        pay.once('collect', async (message) => {
          if (cooldowns.get(interaction.user.id)?.messageId !== msg.id) return;

          ended = true;
          const userData = await client.db.users.patch(interaction.user.id);

          userData.balance += amount;
          await userData.save();

          let embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('تم إكمال عملية الشراء بنجاح !')
            .setTimestamp();

          msg.edit({
            embeds: [embed]
          });

          embed = new EmbedBuilder()
            .setTitle('تم شراء الرصيد بنجاح !')
            .setDescription(`**تم شراء رصيد بنجاح رصيدك الحالي هو : \`${userData.balance}\`**`)
            .setTimestamp();

          message.channel.send({
            content: `${interaction.user}`,
            embeds: [embed]
          });

          const clientsRole = message.guild.roles.cache.get(CLIENTS_ROLE);
          const superClientsRole = message.guild.roles.cache.get(SUPERCLIENTS_ROLE);
          const logChannel = client.channels.cache.get(BALANCE_LOG);

          if (clientsRole && amount < 500) {
            interaction.member.roles.add(clientsRole);
          }
          if (superClientsRole && amount >= 500) {
            interaction.member.roles.add(superClientsRole);
          }
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor('Yellow')
              .setDescription(`**تم شراء \`${amount}\` رصيد بواسطة : ${interaction.user}**`)
              .setTimestamp();

            logChannel.send({
              embeds: [embed]
            });
          }
        });

        pay.once('end', () => {
          if (cooldowns.get(interaction.user.id)?.messageId !== msg.id) return;

          cooldowns.delete(interaction.user.id);

          if (!ended) {
            const embed = new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('لقد انتهى وقت التحويل !')
              .setTimestamp();

            msg.edit({
              embeds: [embed]
            });
          }
        });
      }
    }

    if (interaction.customId === 'members-modal') {
      const users = await client.db.users.Schema.find({
        accessToken: {
          $exists: true
        }
      });

      const amount = interaction.fields.getTextInputValue('amount').toLowerCase() === 'all' ? users.length : +interaction.fields.getTextInputValue('amount');
      const guildID = interaction.fields.getTextInputValue('id');
      const guild = client.guilds.cache.get(guildID);

      if (!amount.isNumber()) return interaction.reply({
        content: '✖️ **هذا العدد غير صحيح!**',
        ephemeral: true
      });

      const userData = await client.db.users.patch(interaction.user.id);

      if (amount > users.length) return interaction.reply({
        content: `✖️ **هذا العدد غير متوفر! المتوفر الان ${users.length}**`,
        ephemeral: true
      });

      if (!guild) return interaction.reply({
        content: '✖️ **يجب أولا إدخال البوت الي هذا الخادم!**',
        ephemeral: true
      });

      if (amount < MIN_MEMBERS) return interaction.reply({
        content: `✖️ **عذرا ولاكن أقل عدد للشراء هو ${MIN_MEMBERS} عضو!**`,
        ephemeral: true
      });

      await interaction.deferReply({
        ephemeral: true
      });
      await guild.members.fetch();
      const usersToFilter = users.splice(users.length - amount, amount).reverse();

      const filteredUsers = usersToFilter.filter((user) => !guild.members.cache.get(user.id));
      const membersToAdd = amount - (amount - filteredUsers.length);

      if (membersToAdd > userData.balance) return interaction.editReply({
        content: '✖️ **ليس لديك رصيد كافي!**',
      });

      if (membersToAdd === 0) return interaction.editReply({
        content: `✖️ **عذرا ولاكن لا يمكن إضافة أعضاء الي هذا الخادم!**`,
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join-${guild.id}-${membersToAdd}`)
          .setStyle(ButtonStyle.Success)
          .setLabel('إدخال'),
        new ButtonBuilder()
          .setCustomId('cancel-m')
          .setStyle(ButtonStyle.Danger)
          .setLabel('إلغاء'));
 
      const msg = await interaction.editReply({
        content: `${guild.name}\n\n**تم إيجاد ${amount - filteredUsers.length} عضو في الخادم من قبل**\nهل انت متأكد ان تريد إدخال ${membersToAdd} عضو؟`,
        components: [row]
      });

      mCooldowns.set(interaction.user.id, {
        messageId: msg.id,
        members: filteredUsers
      });

      setTimeout(() => {
        mCooldowns.delete(interaction.user.id);
      }, 3e5);
    }
  },
};