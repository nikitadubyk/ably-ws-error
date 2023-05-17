import {useState} from 'react';
import {Realtime, Types} from 'ably';

const ABLY_CHANNEL_NAME = 'channel'; // TODO: use valid channel name (required)

export const useAbly = (user: {name: string}) => {
  const [ablyError, setAblyError] = useState<any>();
  const [isAblyConnected, setAblyConnected] = useState<boolean>(false);
  const [ablyClient, setAblyClient] = useState<Realtime | undefined>();
  const [ablyChannel, setAblyChannel] = useState<
    Types.RealtimeChannelCallbacks | undefined
  >();

  const destroyAbly = () => {
    setAblyError(undefined);
    if (ablyChannel) {
      ablyChannel.off();
      setAblyChannel(undefined);
    }
    if (ablyClient) {
      ablyClient.close();
      setAblyClient(undefined);
    }
    setAblyConnected(false);
  };

  const connectAbly = () => {
    if (ablyClient) {
      console.log('ably client already exist');
      return;
    }
    destroyAbly();

    if (user?.name && ablyClient === undefined) {
      try {
        const name = user.name.trim();
        const ablyToken = ''; // TODO: use real token (required)

        const client = new Realtime({
          clientId: name,
          log: {level: 2},
          token: ablyToken,
          useTokenAuth: true,
          //   transports: ['xhr_streaming'], // This corrects the error
          authCallback: async (_params, callback) => {
            if (user.name) {
              try {
                const newToken = {data: ''}; // TODO: use request to take newToken (not required)
                callback('', newToken.data);
              } catch (error) {
                callback((error as any).message, '');
              }
            }
          },
        });
        setAblyClient(client);

        const channel = client.channels.get(ABLY_CHANNEL_NAME);
        setAblyChannel(channel);

        client.connection.on(async state => {
          setAblyConnected(state.current === 'connected');
          const token = ''; // TODO: use accessToken here (not required)
          switch (state.current) {
            case 'connected':
              channel.presence.enter({token});
              break;
            case 'closed':
              channel.presence.leave({token});
              break;
            default:
              break;
          }
        });
      } catch (error) {
        setAblyError(error);
      }
    }
  };

  return {
    ablyError,
    ablyClient,
    ablyChannel,
    connectAbly,
    destroyAbly,
    isAblyConnected,
  };
};
