import { llm } from '@livekit/agents';
import { TipGenerationService } from './tip-generation.service';

export class TipGenerationServiceFactory {
  public static create(llmInstance: llm.LLM): TipGenerationService {
    return new TipGenerationService(llmInstance);
  }
}
