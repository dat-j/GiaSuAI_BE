import { Injectable } from '@nestjs/common';
import { evaluate, parse } from 'mathjs';

export interface VerificationResult {
  verified: boolean;
  warning?: string;
}

@Injectable()
export class VerifierService {
  verify(
    variables: Record<string, any>,
    verificationPayload: { equation_lhs: string; equation_rhs: string } | null,
  ): VerificationResult {
    if (!verificationPayload || !variables || Object.keys(variables).length === 0) {
      return { verified: false, warning: 'Không có dữ liệu kiểm tra' };
    }

    try {
      const { equation_lhs, equation_rhs } = verificationPayload;
      const varEntries = Object.entries(variables);

      if (varEntries.length === 0) {
        return { verified: false, warning: 'Không có biến để kiểm tra' };
      }

      const [varName, varValue] = varEntries[0];

      // Quadratic: array of roots
      if (Array.isArray(varValue)) {
        const allValid = varValue.every((val: number) => {
          const scope = { [varName]: val };
          const lhs = evaluate(equation_lhs, scope);
          const rhs = evaluate(equation_rhs, scope);
          return Math.abs(lhs - rhs) < 1e-9;
        });
        return { verified: allValid };
      }

      // Single value
      const scope = { [varName]: varValue };
      const lhs = evaluate(equation_lhs, scope);
      const rhs = evaluate(equation_rhs, scope);

      if (Math.abs(lhs - rhs) < 1e-9) {
        return { verified: true };
      }

      // Numerical result check: equation_lhs is an expression = varValue
      if (varEntries.length > 1 || typeof varValue === 'number') {
        const result = evaluate(equation_lhs);
        if (Math.abs(result - varValue) < 1e-9) {
          return { verified: true };
        }
      }

      return { verified: false, warning: 'Đáp án không thỏa phương trình' };
    } catch {
      return { verified: false, warning: 'Không thể kiểm tra đáp án tự động' };
    }
  }
}
