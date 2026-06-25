import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { SOLVE_SCHEMA } from './solve-schema';

export interface GeminiSolveResult {
  raw: any;
  inputTokens: number;
  outputTokens: number;
  problemText?: string;
}

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI;

  constructor(private config: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY') });
  }

  async solveText(
    text: string,
    model: string,
  ): Promise<GeminiSolveResult> {
    const prompt = this.buildTextPrompt(text);
    return this.callGemini(model, [{ text: prompt }], text);
  }

  async solveImage(
    imageBase64: string,
    model: string,
  ): Promise<GeminiSolveResult> {
    const contents = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
      {
        text: this.buildImagePrompt(),
      },
    ];
    return this.callGemini(model, contents);
  }

  private async callGemini(
    model: string,
    contents: any[],
    problemText?: string,
  ): Promise<GeminiSolveResult> {
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: contents }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: SOLVE_SCHEMA as any,
        },
      });

      const text = response.text as unknown as string;
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new InternalServerErrorException('Lỗi AI, thử lại sau');
      }

      const usageMeta = response.usageMetadata;
      return {
        raw: parsed,
        inputTokens: usageMeta?.promptTokenCount ?? 0,
        outputTokens: usageMeta?.candidatesTokenCount ?? 0,
        problemText,
      };
    } catch (err: any) {
      if (err?.status === 429) {
        throw new InternalServerErrorException('Lỗi AI, thử lại sau');
      }
      throw new InternalServerErrorException('Lỗi AI, thử lại sau');
    }
  }

  private buildTextPrompt(text: string): string {
    return `Bạn là AI gia sư Toán Việt Nam. Giải bài toán sau theo chương trình Toán THCS/THPT Việt Nam.
Giải thích từng bước bằng tiếng Việt rõ ràng. Công thức dùng LaTeX (không có dấu $).
Xác định lớp học và chủ đề theo chương trình Toán Việt Nam.

Bài toán: ${text}`;
  }

  private buildImagePrompt(): string {
    return `Bạn là AI gia sư Toán Việt Nam. Đọc bài toán từ ảnh và giải theo chương trình Toán THCS/THPT Việt Nam.
Giải thích từng bước bằng tiếng Việt rõ ràng. Công thức dùng LaTeX (không có dấu $).
Xác định lớp học và chủ đề theo chương trình Toán Việt Nam.`;
  }
}
