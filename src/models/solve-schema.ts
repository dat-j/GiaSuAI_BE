export const SOLVE_SCHEMA = {
  type: 'object',
  required: [
    'problem_type', 'difficulty', 'steps', 'final_answer',
    'answer_type', 'variables', 'confidence', 'grade_level',
    'curriculum_topic', 'common_mistakes', 'similar_questions', 'warnings',
  ],
  properties: {
    problem_type: { type: 'string' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'explanation'],
        properties: {
          title: { type: 'string' },
          explanation: { type: 'string' },
          formula_latex: { type: 'string', nullable: true },
        },
      },
    },
    final_answer: { type: 'string' },
    answer_type: { type: 'string' },
    variables: { type: 'object', additionalProperties: true },
    verification_payload: {
      type: 'object',
      nullable: true,
      properties: {
        equation_lhs: { type: 'string' },
        equation_rhs: { type: 'string' },
      },
    },
    confidence: { type: 'number' },
    warnings: { type: 'array', items: { type: 'string' } },
    grade_level: { type: 'string' },
    curriculum_topic: { type: 'string' },
    common_mistakes: { type: 'array', items: { type: 'string' } },
    similar_questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          difficulty: { type: 'string' },
        },
      },
    },
  },
};
