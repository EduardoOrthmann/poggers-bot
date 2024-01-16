import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from '@discordjs/voice';
import { Client } from 'discord.js';
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

const audioPathByMemberId = {
  '476441312325926917': './audios/eduardo.mp3',
  '975212351928274966': './audios/gb.mp3',
  '440201882326007818': './audios/joao.mp3',
};
const botId = '1153394926034354287';
const memberNotStoredAudioPath = './audios/kiko.mp3';

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!newState.channel || oldState.channel) return;
  if (newState.member.id === botId) return;

  const connection = joinVoiceChannel({
    channelId: newState.channelId,
    guildId: newState.guild.id,
    adapterCreator: newState.guild.voiceAdapterCreator,
  });

  const audioPath = audioPathByMemberId[newState.member.id];
  const resource = createAudioResource(createReadStream(audioPath || memberNotStoredAudioPath));

  const player = createAudioPlayer();
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
});

client.login(process.env.TOKEN);
