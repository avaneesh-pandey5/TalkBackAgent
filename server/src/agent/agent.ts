import { voice } from "@livekit/agents";

export class Agent extends voice.Agent {
  constructor(systemPrompt: string) {
    super({
      instructions: systemPrompt,
    });
  }
}
