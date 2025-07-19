require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const unverifiedRoleId = '1395586600809005106'; // Unverified role ID
const verifiedRoleId = '1395603809983533077';   // Verified role ID
const welcomeChannelId = '1246726895282688041'; // Your welcome channel ID

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    const unverifiedRole = member.guild.roles.cache.get(unverifiedRoleId);
    if (unverifiedRole) {
      await member.roles.add(unverifiedRole);
      console.log(`🕵️‍♂️ Assigned Unverified role to ${member.user.tag}`);
    }

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle(`Welcome @${member.user.username}!`)
        .setDescription('If I made an OnlyFans, would you join?')
        .setColor('Blurple');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_yes_${member.id}`)
          .setLabel('Yes')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`verify_no_${member.id}`)
          .setLabel('No')
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: `<@${member.id}>`,
        embeds: [embed],
        components: [row]
      });
    }
  } catch (err) {
    console.error('Error in guildMemberAdd:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [prefix, response, userId] = interaction.customId.split('_');
  if (prefix !== 'verify') return;

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "This isn't your button to click!", ephemeral: true });
  }

  const member = await interaction.guild.members.fetch(userId);
  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

  if (response === 'yes') {
    try {
      await member.send('You answered **yes**... Goodbye 😈').catch(() => {});
      await member.ban({ reason: 'Said yes to OnlyFans.' });
      await interaction.reply({ content: '💀 You have been banned. Goodbye.', ephemeral: true });
    } catch (err) {
      console.error('Failed to ban:', err);
      await interaction.reply({ content: '❌ Failed to ban user. Missing permissions?', ephemeral: true });
    }
  } else if (response === 'no') {
    try {
      if (member.roles.cache.has(unverifiedRoleId)) {
        await member.roles.remove(unverifiedRoleId);
      }
      const verifiedRole = interaction.guild.roles.cache.get(verifiedRoleId);
      if (verifiedRole && !member.roles.cache.has(verifiedRoleId)) {
        await member.roles.add(verifiedRole);
      }
      await interaction.reply({ content: '✅ You are now verified!', ephemeral: true });
    } catch (err) {
      console.error('Failed to verify:', err);
      await interaction.reply({ content: '❌ Failed to verify. Missing permissions?', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
