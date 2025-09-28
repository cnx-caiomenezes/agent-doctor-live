import { AccessToken } from 'livekit-server-sdk';
import type { VideoGrant } from 'livekit-server-sdk';

/**
 * VideoGrant options for generating LiveKit access tokens.
 *
 * roomCreate	{boolean} -	Permission to create or delete rooms
 * roomList	{boolean} -	Permission to list available rooms
 * roomJoin	{boolean} -	Permission to join a room
 * roomAdmin	{boolean} -	Permission to moderate a room
 * roomRecord	{boolean} -	Permissions to use Egress service
 * ingressAdmin	{boolean} -	Permissions to use Ingress service
 * room	string	Name of the room, required if join or admin is set
 * canPublish	{boolean} -	Allow participant to publish tracks
 * canPublishData	{boolean} -	Allow participant to publish data to the room
 * canPublishSources	string[]	Requires canPublish to be true. When set, only listed source can be published. (camera, microphone, screen_share, screen_share_audio)
 * canSubscribe	{boolean} -	Allow participant to subscribe to tracks
 * canUpdateOwnMetadata	{boolean} -	Allow participant to update its own metadata
 * hidden	{boolean} -	Hide participant from others in the room
 * kind	{string} - Type of participant (standard, ingress, egress, sip, or agent). this field is typically set by LiveKit internals.
**/

/**
 * Generates a LiveKit access token for a given room and participant.
 * 
 * @param roomName - The name of the room to join.
 * @param participantName - The identity of the participant.
 * @returns {string} accessToken - A JWT access token string.
 * @throws Will throw an error if LIVEKIT_API_KEY or LIVEKIT_API_SECRET are not set in environment variables.
 */
export const generateToken = async (roomName: string, participantName: string): Promise<string> => {
  const DOCTOR_LIVE_API_KEY = process.env.LIVEKIT_API_KEY ?? '';
  const DOCTOR_LIVE_API_SECRET = process.env.LIVEKIT_API_SECRET ?? '';

  if (!DOCTOR_LIVE_API_KEY || !DOCTOR_LIVE_API_SECRET) {
    throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set');
  }

  const accessToken = new AccessToken(DOCTOR_LIVE_API_KEY, DOCTOR_LIVE_API_SECRET, {
    identity: participantName,
  });

  const videoGrant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  };

  accessToken.addGrant(videoGrant);

  return accessToken.toJwt();
};
