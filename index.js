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

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!newState.channel || oldState.channel) return;

  const connection = joinVoiceChannel({
    channelId: newState.channelId,
    guildId: newState.guild.id,
    adapterCreator: newState.guild.voiceAdapterCreator,
  });

  let resource;

  const audioPath = audioPathByMemberId[newState.member.id];

  if (audioPath) {
    resource = createAudioResource(createReadStream(audioPath));
  } else {
    if (newState.member.id === '1153394926034354287') return;
    resource = createAudioResource(createReadStream('./audios/kiko.mp3'));
  }

  const player = createAudioPlayer();
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
});

client.login(process.env.TOKEN);
