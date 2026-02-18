import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
} from "livekit-client";

export type RoomStatus = "disconnected" | "connecting" | "connected";

type ConnectOptions = {
  url: string;
  token: string;
  audioContainer?: HTMLElement | null;
  onError?: (message: string) => void;
  onStatusChange?: (status: RoomStatus) => void;
};

export class LiveKitRoomController {
  private room: Room | null = null;
  private audioElements = new Set<HTMLMediaElement>();
  private audioContainer: HTMLElement | null = null;

  public get isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  async connect(options: ConnectOptions): Promise<void> {
    if (this.room) {
      await this.disconnect();
    }

    const { url, token, audioContainer, onError, onStatusChange } = options;
    onStatusChange?.("connecting");

    const room = new Room();
    this.audioContainer = audioContainer ?? null;

    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === ConnectionState.Connected) {
        onStatusChange?.("connected");
      } else if (state === ConnectionState.Connecting) {
        onStatusChange?.("connecting");
      } else if (state === ConnectionState.Disconnected) {
        onStatusChange?.("disconnected");
      }
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
      onStatusChange?.("disconnected");
    });

    try {
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      this.room = room;
      onStatusChange?.("connected");
    } catch (error) {
      room.disconnect();
      this.detachAllAudio();
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
  }

  private detachAllAudio(): void {
    for (const element of this.audioElements) {
      element.remove();
    }
    this.audioElements.clear();
  }
}
