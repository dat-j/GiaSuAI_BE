import {
  BadRequestException, Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { GeminiService } from '../models/gemini.service';
import { ModelRouterService } from '../models/model-router.service';
import { VerifierService } from './verifier.service';
import { QuotaService } from '../quota/quota.service';
import { SolveRequest } from '../database/entities/solve-request.entity';
import { SolveFeedback } from '../database/entities/solve-feedback.entity';
import { SolveRequestDto, SolveFeedbackDto } from './solve.dto';
import { User } from '../database/entities/user.entity';

const VALID_IMAGE_MAGIC: Record<string, Buffer> = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

@Injectable()
export class SolveService {
  constructor(
    private gemini: GeminiService,
    private router: ModelRouterService,
    private verifier: VerifierService,
    private quota: QuotaService,
    @InjectRepository(SolveRequest) private solveRepo: Repository<SolveRequest>,
    @InjectRepository(SolveFeedback) private feedbackRepo: Repository<SolveFeedback>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async solve(
    dto: SolveRequestDto,
    uid: string,
    isPremium: boolean,
    ip: string,
  ): Promise<any> {
    if (dto.input_type === 'text' && !dto.text?.trim()) {
      throw new BadRequestException({ code: 'INVALID_INPUT', message: 'input_type hoặc text/image thiếu' });
    }
    if (dto.input_type === 'image') {
      this.validateImage(dto.image_base64);
    }

    const redis = this.quota.getRedis();
    const cacheKey = this.buildCacheKey(dto);
    const cached = await redis.get(cacheKey);

    const start = Date.now();
    let aiResult: any;
    let inputTokens = 0;
    let outputTokens = 0;
    let modelUsed: string;
    let problemText = dto.text ?? '';

    if (cached) {
      const parsed = JSON.parse(cached);
      aiResult = parsed.raw;
      modelUsed = parsed.model_used;
      problemText = parsed.problem_text ?? problemText;
    } else {
      modelUsed = this.router.resolve(dto.mode, isPremium);
      let geminiResult: any;

      if (dto.input_type === 'text') {
        geminiResult = await this.gemini.solveText(dto.text!, modelUsed);
      } else {
        geminiResult = await this.gemini.solveImage(dto.image_base64!, modelUsed);
        // For image input, problem_text comes from AI OCR
        problemText = geminiResult.raw?.problem_text ?? '';
      }

      aiResult = geminiResult.raw;
      inputTokens = geminiResult.inputTokens;
      outputTokens = geminiResult.outputTokens;

      await redis.set(
        cacheKey,
        JSON.stringify({ raw: aiResult, model_used: modelUsed, problem_text: problemText }),
        'EX',
        604800,
      );
    }

    const latencyMs = Date.now() - start;
    const verification = this.verifier.verify(
      aiResult.variables,
      aiResult.verification_payload,
    );

    let confidence = aiResult.confidence ?? 0.85;
    const warnings: string[] = [...(aiResult.warnings ?? [])];

    if (!verification.verified) {
      confidence = Math.max(0, confidence - 0.3);
      if (verification.warning) warnings.push(verification.warning);
    }

    const user = await this.quota.findOrCreateUser(uid);
    const costUsd = this.router.estimateCostUsd(modelUsed, inputTokens, outputTokens);
    const problemHash = createHash('sha256').update(problemText + dto.mode).digest('hex');

    const solveRequest = this.solveRepo.create({
      user,
      input_type: dto.input_type,
      problem_hash: problemHash,
      problem_text: problemText,
      mode: dto.mode,
      model_used: modelUsed,
      verified: verification.verified,
      confidence,
      latency_ms: latencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    });
    const saved = await this.solveRepo.save(solveRequest);

    await this.quota.incrementCounters(uid, ip);
    const quotaRemaining = await this.quota.getRemaining(uid, isPremium);

    return {
      id: saved.id,
      problem_text: problemText,
      problem_type: aiResult.problem_type,
      difficulty: aiResult.difficulty,
      steps: aiResult.steps,
      final_answer: aiResult.final_answer,
      answer_type: aiResult.answer_type,
      variables: aiResult.variables,
      verification_payload: aiResult.verification_payload,
      confidence,
      verified: verification.verified,
      warnings,
      grade_level: aiResult.grade_level,
      curriculum_topic: aiResult.curriculum_topic,
      common_mistakes: aiResult.common_mistakes,
      similar_questions: aiResult.similar_questions,
      model_used: modelUsed,
      quota_remaining: quotaRemaining,
    };
  }

  async submitFeedback(
    solveId: string,
    dto: SolveFeedbackDto,
    uid: string,
  ): Promise<void> {
    const solveRequest = await this.solveRepo.findOne({ where: { id: solveId } });
    if (!solveRequest) throw new BadRequestException('Không tìm thấy bài giải');

    const user = await this.userRepo.findOne({ where: { firebase_uid: uid } });
    const feedback = this.feedbackRepo.create({
      solve_request: solveRequest,
      user: user ?? undefined,
      type: dto.type,
      note: dto.note,
    });
    await this.feedbackRepo.save(feedback);
  }

  async getMe(uid: string, isPremium: boolean): Promise<any> {
    const user = await this.quota.findOrCreateUser(uid);
    const limit = isPremium ? 50 : 5;
    const remaining = await this.quota.getRemaining(uid, isPremium);
    const used = limit - remaining;

    const vnOffset = 7 * 60;
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    const vnNow = new Date(utc + vnOffset * 60000);
    const resetAt = new Date(vnNow);
    resetAt.setHours(24, 0, 0, 0);

    return {
      uid,
      tier: isPremium ? 'premium' : 'free',
      quota: {
        used,
        limit,
        remaining,
        reset_at: new Date(resetAt.getTime() - vnOffset * 60000).toISOString(),
      },
      premium_until: null,
    };
  }

  private buildCacheKey(dto: SolveRequestDto): string {
    const base = dto.input_type === 'text'
      ? (dto.text ?? '') + ':' + dto.mode
      : createHash('sha256').update(dto.image_base64 ?? '').digest('hex') + ':' + dto.mode;
    return 'solve_cache:' + createHash('sha256').update(base).digest('hex');
  }

  private validateImage(base64?: string): void {
    if (!base64) {
      throw new BadRequestException({ code: 'INVALID_INPUT', message: 'image_base64 thiếu' });
    }
    const buffer = Buffer.from(base64.slice(0, 8), 'base64');
    const isJpeg = buffer.slice(0, 3).equals(VALID_IMAGE_MAGIC.jpeg);
    const isPng = buffer.slice(0, 4).equals(VALID_IMAGE_MAGIC.png);
    if (!isJpeg && !isPng) {
      throw new BadRequestException({ code: 'INVALID_IMAGE', message: 'Định dạng ảnh không hợp lệ' });
    }
    const byteLength = (base64.length * 3) / 4;
    if (byteLength > 2 * 1024 * 1024) {
      throw new BadRequestException({ code: 'IMAGE_TOO_LARGE', message: 'Ảnh vượt quá 2MB' });
    }
  }
}
