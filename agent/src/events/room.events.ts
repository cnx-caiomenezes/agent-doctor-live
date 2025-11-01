import type { JobContext } from '@livekit/agents';

export function registerRoomEvents(room: JobContext['room']): void {
  room.on('connected', () => {
    console.log('[Room] Connected');
  });

  room.on('disconnected', (reason) => {
    console.log('[Room] Disconnected:', { reason });
  });

  room.on('reconnecting', () => {
    console.log('[Room] Reconnecting');
  });

  room.on('reconnected', () => {
    console.log('[Room] Reconnected');
  });

  room.on('connectionStateChanged', (state) => {
    console.log('[Room] ConnectionStateChanged:', { state });
  });

  room.on('connectionQualityChanged', (quality, participant) => {
    console.log('[Room] ConnectionQualityChanged:', {
      participant: participant?.identity,
      quality,
    });
  });

  room.on('encryptionError', (error) => {
    console.log('[Room] EncryptionError:', { error });
  });

  room.on('participantConnected', (participant) => {
    console.log('[Room] ParticipantConnected:', {
      identity: participant.identity,
      sid: participant.sid,
      name: participant.name,
      metadata: participant.metadata,
    });
  });

  room.on('participantDisconnected', (participant) => {
    console.log('[Room] ParticipantDisconnected:', {
      identity: participant.identity,
      sid: participant.sid,
    });
  });

  room.on('participantMetadataChanged', (metadata, participant) => {
    console.log('[Room] ParticipantMetadataChanged:', {
      participant: participant.identity,
      metadata,
    });
  });

  room.on('participantNameChanged', (name, participant) => {
    console.log('[Room] ParticipantNameChanged:', {
      participant: participant.identity,
      name,
    });
  });

  room.on('participantAttributesChanged', (changedAttributes, participant) => {
    console.log('[Room] ParticipantAttributesChanged:', {
      participant: participant.identity,
      changedAttributes,
    });
  });

  room.on('activeSpeakersChanged', (speakers) => {
    console.log('[Room] ActiveSpeakersChanged:', {
      speakers: speakers.map((p) => p.identity),
    });
  });

  room.on('trackPublished', (publication, participant) => {
    console.log('[Room] TrackPublished:', {
      participant: participant.identity,
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  room.on('trackUnpublished', (publication, participant) => {
    console.log('[Room] TrackUnpublished:', {
      participant: participant.identity,
      trackSid: publication.sid,
    });
  });

  room.on('trackSubscribed', (track, publication, participant) => {
    console.log('[Room] TrackSubscribed:', {
      participant: participant.identity,
      trackSid: track.sid,
      kind: track.kind,
    });
  });

  room.on('trackUnsubscribed', (track, publication, participant) => {
    console.log('[Room] TrackUnsubscribed:', {
      participant: participant.identity,
      trackSid: track.sid,
    });
  });

  room.on('trackMuted', (publication, participant) => {
    console.log('[Room] TrackMuted:', {
      participant: participant.identity,
      trackSid: publication.sid,
    });
  });

  room.on('trackUnmuted', (publication, participant) => {
    console.log('[Room] TrackUnmuted:', {
      participant: participant.identity,
      trackSid: publication.sid,
    });
  });

  room.on('localTrackPublished', (publication) => {
    console.log('[Room] LocalTrackPublished:', {
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  room.on('localTrackUnpublished', (publication) => {
    console.log('[Room] LocalTrackUnpublished:', {
      trackSid: publication.sid,
    });
  });

  room.on('trackSubscriptionFailed', (trackSid, participant) => {
    console.log('[Room] TrackSubscriptionFailed:', {
      participant: participant.identity,
      trackSid,
    });
  });

  room.on('roomMetadataChanged', (metadata) => {
    console.log('[Room] RoomMetadataChanged:', { metadata });
  });

  room.on('dataReceived', (payload, participant, kind, topic) => {
    console.log('[Room] DataReceived:', {
      participant: participant?.identity,
      kind,
      topic,
      payloadSize: payload.byteLength,
    });
  });
}
