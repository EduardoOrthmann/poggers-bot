import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from '@discordjs/voice';
import {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from 'discord.js';
import { createReadStream } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
    'GuildVoiceStates',
    'GuildMembers',
  ],
});

const commands = [
  {
    command: 'ping',
    callback: pingFunction,
  },
  {
    command: 'survey',
    callback: startSurvey,
  },
];

const audioPathByMemberId = {
  '476441312325926917': './audios/eduardo.mp3',
  '975212351928274966': './audios/gb.mp3',
  '440201882326007818': './audios/joao.mp3',
};
const botId = '1153394926034354287';
const memberNotStoredAudioPath = './audios/kiko.mp3';
const prefix = '!';

// client.once('ready', () => {
//   client.guilds.cache.forEach((guild) => {
//     const channel = guild.channels.cache.find(
//       (channel) => channel.name === 'geral'
//     );

//     if (!channel) return;

//     channel.send('Voltei da merda 👌');
//   });
// });

// client.on('ready', () => {
//   setInterval(() => {
//     const now = new Date();

//     if (now.getHours() !== 20) return;

//     client.guilds.cache.forEach((guild) => {
//       const channel = guild.channels.cache.find(
//         (channel) => channel.name === 'geral'
//       );

//       if (!channel) return;

//       channel.send('Boa noite, vão a merda 👌');
//     });
//   }, 3600000) // one hour
// });

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!newState.channel || oldState.channel) return;
  if (newState.member.id === botId) return;

  const connection = joinVoiceChannel({
    channelId: newState.channelId,
    guildId: newState.guild.id,
    adapterCreator: newState.guild.voiceAdapterCreator,
  });

  const audioPath = audioPathByMemberId[newState.member.id];
  const resource = createAudioResource(
    createReadStream(audioPath || memberNotStoredAudioPath)
  );

  const player = createAudioPlayer();
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
});

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const commandObject = commands.find((cmd) => cmd.command === command);

  if (commandObject) {
    commandObject.callback(message);
  }
});

function pingFunction(message) {
  message.reply('pong');
}

async function startSurvey(message) {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    message.reply(
      'Você precisa estar em um canal de voz para iniciar a votação.'
    );
    return;
  }

  const membersInVoiceChannel = voiceChannel.members.map(
    (member) => member.displayName
  );

  const row = new ActionRowBuilder().addComponents(
    membersInVoiceChannel.map((member) =>
      new ButtonBuilder()
        .setCustomId(member)
        .setLabel(member)
        .setStyle('Primary')
    )
  );

  const embed = new EmbedBuilder()
    .setTitle('Quem é o mais esmerdalhado?')
    .addFields(
      membersInVoiceChannel.map((member) => ({
        name: member,
        value: '0',
        inline: true,
      }))
    )
    .setColor('Random');

  const surveyMessage = await message.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = surveyMessage.createMessageComponentCollector(
    (interaction) => interaction.customId !== 'stop',
    { time: 60000 } // 1 minute
  );

  const votes = new Map();

  collector.on('collect', (interaction) => {
    const selectedMember = interaction.customId;

    const newFields = surveyMessage.embeds[0].fields.map((field) => {
      if (field.name === selectedMember) {
        return {
          name: field.name,
          value: `${Number(field.value) + 1}`,
          inline: true,
        };
      }
      return field;
    });
  
    const updatedEmbed = new EmbedBuilder()
      .setTitle('Quem é o mais esmerdalhado?')
      .addFields(newFields)
      .setColor('Random');
  
    surveyMessage.edit({
      embeds: [updatedEmbed],
    });

    const currentVotes = votes.get(selectedMember) || 0;
    votes.set(selectedMember, currentVotes + 1);
  });

  collector.on('end', () => {
    const winner = getWinner(votes);

    if (winner) {
      message.channel.send(`The winner is: ${winner}`);
    } else {
      message.channel.send('The survey ended, but no one received any votes.');
    }
  });
}

function getWinner(votes) {
  let maxVotes = 0;
  let winner = null;

  for (const [member, voteCount] of votes.entries()) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winner = member;
    }
  }

  return winner;
}

client.login(process.env.TOKEN);

