import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type TranscriptionSegment,
} from "livekit-client";

export type RoomStatus = "disconnected" | "connecting" | "connected";

export type VoiceActivity = {
  userSpeaking: boolean;
  agentSpeaking: boolean;
};

export type SpeakerRole = "user" | "agent";

export type SpeakerTranscript = {
  text: string;
  isFinal: boolean;
};

export type LiveTranscripts = {
  user: SpeakerTranscript;
  agent: SpeakerTranscript;
};

type ConnectOptions = {
  url: string;
  token: string;
  audioContainer?: HTMLElement | null;
  onError?: (message: string) => void;
  onStatusChange?: (status: RoomStatus) => void;
  onVoiceActivityChange?: (activity: VoiceActivity) => void;
  onTranscriptsChange?: (transcripts: LiveTranscripts) => void;
};

export class LiveKitRoomController {
  private room: Room | null = null;
  private audioElements = new Set<HTMLMediaElement>();
  private audioContainer: HTMLElement | null = null;
  private transcriptSegments: Record<SpeakerRole, Map<string, TranscriptionSegment>> = {
    user: new Map(),
    agent: new Map(),
  };

  public get isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  async connect(options: ConnectOptions): Promise<void> {
    if (this.room) {
      await this.disconnect();
    }

    const {
      url,
      token,
      audioContainer,
      onError,
      onStatusChange,
      onVoiceActivityChange,
      onTranscriptsChange,
    } = options;
    onStatusChange?.("connecting");
    this.resetTranscripts(onTranscriptsChange);

    const room = new Room();
    this.audioContainer = audioContainer ?? null;

    const emitVoiceActivity = (speakers: { sid: string }[]) => {
      const localParticipantSid = room.localParticipant.sid;
      const userSpeaking = speakers.some((speaker) => speaker.sid === localParticipantSid);
      const agentSpeaking = speakers.some((speaker) => speaker.sid !== localParticipantSid);
      onVoiceActivityChange?.({ userSpeaking, agentSpeaking });
    };

    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === ConnectionState.Connected) {
        onStatusChange?.("connected");
      } else if (state === ConnectionState.Connecting) {
        onStatusChange?.("connecting");
      } else if (state === ConnectionState.Disconnected) {
        onStatusChange?.("disconnected");
      }
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      emitVoiceActivity(speakers);
    });

    room.on(RoomEvent.TranscriptionReceived, (transcription, participant) => {
      const localIdentity = room.localParticipant.identity;
      const role: SpeakerRole =
        participant?.identity === localIdentity ? "user" : "agent";
      const roleSegments = this.transcriptSegments[role];

      for (const segment of transcription) {
        roleSegments.set(segment.id, segment);
      }

      this.pruneRoleSegments(role);
      onTranscriptsChange?.(this.buildTranscriptState());
    });

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return;

      const element = track.attach() as HTMLMediaElement;
      element.autoplay = true;
      element.playsInline = true;
      this.audioElements.add(element);
      this.audioContainer?.appendChild(element);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      for (const element of track.detach()) {
        this.audioElements.delete(element);
        element.remove();
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      this.detachAllAudio();
      onVoiceActivityChange?.({ userSpeaking: false, agentSpeaking: false });
      this.resetTranscripts(onTranscriptsChange);
      onStatusChange?.("disconnected");
    });

    try {
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      this.room = room;
      onVoiceActivityChange?.({ userSpeaking: false, agentSpeaking: false });
      onTranscriptsChange?.(this.buildTranscriptState());
      onStatusChange?.("connected");
    } catch (error) {
      room.disconnect();
      this.detachAllAudio();
      onVoiceActivityChange?.({ userSpeaking: false, agentSpeaking: false });
      this.resetTranscripts(onTranscriptsChange);
      onStatusChange?.("disconnected");
      onError?.(error instanceof Error ? error.message : "Failed to connect.");
      throw error;
    }
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    if (!this.room || !this.isConnected) return;
    await this.room.localParticipant.setMicrophoneEnabled(enabled);
  }

  async disconnect(): Promise<void> {
    if (!this.room) return;
    this.room.disconnect();
    this.room = null;
    this.detachAllAudio();
    this.resetTranscripts();
  }

  private detachAllAudio(): void {
    for (const element of this.audioElements) {
      element.remove();
    }
    this.audioElements.clear();
  }

  private pruneRoleSegments(role: SpeakerRole): void {
    const segments = Array.from(this.transcriptSegments[role].values());
    if (segments.length === 0) return;

    const newestTime = Math.max(...segments.map((segment) => segment.lastReceivedTime));
    const recentSegments = segments
      .filter((segment) => newestTime - segment.lastReceivedTime <= 12000)
      .sort((a, b) => a.startTime - b.startTime);

    const MAX_SEGMENTS = 32;
    const kept = recentSegments.slice(-MAX_SEGMENTS);
    this.transcriptSegments[role] = new Map(kept.map((segment) => [segment.id, segment]));
  }

  private getSpeakerTranscript(role: SpeakerRole): SpeakerTranscript {
    const segments = Array.from(this.transcriptSegments[role].values()).sort(
      (a, b) => a.startTime - b.startTime,
    );
    const text = segments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      text,
      isFinal: segments.length > 0 && segments.every((segment) => segment.final),
    };
  }

  private buildTranscriptState(): LiveTranscripts {
    return {
      user: this.getSpeakerTranscript("user"),
      agent: this.getSpeakerTranscript("agent"),
    };
  }

  private resetTranscripts(onTranscriptsChange?: (transcripts: LiveTranscripts) => void): void {
    this.transcriptSegments.user.clear();
    this.transcriptSegments.agent.clear();
    onTranscriptsChange?.(this.buildTranscriptState());
  }
}
