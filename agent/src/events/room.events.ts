import type { JobContext } from '@livekit/agents';

/**
 * Registra todos os eventos de sala do LiveKit
 * @param room - Instância da sala do contexto do job
 */
export function registerRoomEvents(room: JobContext['room']): void {
  // ============================================
  // Connection Events
  // ============================================

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

  // ============================================
  // Participant Events
  // ============================================

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

  // ============================================
  // Track Publication Events
  // ============================================

  room.on('trackPublished', (publication, participant) => {
    console.log('[Room] TrackPublished:', {
      participant: participant.identity,
      trackSid: publication.sid,
      source: publication.source,
      kind: publication.kind,
    });
  });

  room.on('trackUnpublished', (publication, participant) => {
    console.log('[Room] TrackUnpublished:', {
      participant: participant.identity,
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  // ============================================
  // Track Subscription Events
  // ============================================

  room.on('trackSubscribed', (track, publication, participant) => {
    console.log('[Room] TrackSubscribed:', {
      participant: participant.identity,
      trackSid: track.sid,
      kind: track.kind,
      source: publication.source,
    });
  });

  room.on('trackUnsubscribed', (track, publication, participant) => {
    console.log('[Room] TrackUnsubscribed:', {
      participant: participant.identity,
      trackSid: track.sid,
      kind: track.kind,
    });
  });

  room.on('trackSubscriptionFailed', (trackSid, participant, reason) => {
    console.log('[Room] TrackSubscriptionFailed:', {
      participant: participant.identity,
      trackSid,
      reason,
    });
  });

  // ============================================
  // Track Mute Events
  // ============================================

  room.on('trackMuted', (publication, participant) => {
    console.log('[Room] TrackMuted:', {
      participant: participant.identity,
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  room.on('trackUnmuted', (publication, participant) => {
    console.log('[Room] TrackUnmuted:', {
      participant: participant.identity,
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  // ============================================
  // Local Track Events
  // ============================================

  room.on('localTrackPublished', (publication, participant) => {
    console.log('[Room] LocalTrackPublished:', {
      participant: participant?.identity,
      trackSid: publication.sid,
      source: publication.source,
      kind: publication.kind,
    });
  });

  room.on('localTrackUnpublished', (publication, participant) => {
    console.log('[Room] LocalTrackUnpublished:', {
      participant: participant?.identity,
      trackSid: publication.sid,
      source: publication.source,
    });
  });

  room.on('localTrackSubscribed', (track) => {
    console.log('[Room] LocalTrackSubscribed:', {
      trackSid: track.sid,
      kind: track.kind,
    });
  });

  // ============================================
  // Room Metadata Events
  // ============================================

  room.on('roomMetadataChanged', (metadata) => {
    console.log('[Room] RoomMetadataChanged:', { metadata });
  });

  room.on('roomSidChanged', (sid) => {
    console.log('[Room] RoomSidChanged:', { sid });
  });

  room.on('roomUpdated', () => {
    console.log('[Room] RoomUpdated');
  });

  room.on('roomInfoUpdated', (info) => {
    console.log('[Room] RoomInfoUpdated:', {
      name: info.name,
      sid: info.sid,
      metadata: info.metadata,
      numParticipants: info.numParticipants,
      numPublishers: info.numPublishers,
    });
  });

  // ============================================
  // Data Events
  // ============================================

  room.on('dataReceived', (payload, participant, kind, topic) => {
    console.log('[Room] DataReceived:', {
      participant: participant?.identity,
      kind,
      topic,
      payloadSize: payload.byteLength,
    });
  });

  room.on('chatMessage', (message, participant) => {
    console.log('[Room] ChatMessageReceived:', {
      participant: participant?.identity,
      message: message.message,
      id: message.id,
      timestamp: message.timestamp,
    });
  });

  room.on('dtmfReceived', (code, digit, participant) => {
    console.log('[Room] DtmfReceived:', {
      participant: participant.identity,
      code,
      digit,
    });
  });

  // ============================================
  // Error Events
  // ============================================

  room.on('encryptionError', (error) => {
    console.error('[Room] EncryptionError:', {
      message: error.message,
      stack: error.stack,
    });
  });

  // ============================================
  // Movement Events
  // ============================================

  room.on('moved', () => {
    console.log('[Room] Moved - Room has been moved to a different server');
  });
}

