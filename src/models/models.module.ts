import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ModelRouterService } from './model-router.service';

@Module({
  providers: [GeminiService, ModelRouterService],
  exports: [GeminiService, ModelRouterService],
})
export class ModelsModule {}
