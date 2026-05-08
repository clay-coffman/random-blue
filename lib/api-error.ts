import { NextResponse } from 'next/server';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(opts: {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
  }) {
    super(opts.message);
    this.code = opts.code;
    this.status = opts.status ?? 400;
    this.details = opts.details;
  }

  toJSON(): ApiErrorBody {
    return {
      error: { code: this.code, message: this.message, details: this.details },
    };
  }

  toResponse(): NextResponse<ApiErrorBody> {
    return NextResponse.json(this.toJSON(), { status: this.status });
  }
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return new ApiError({ code, message, status, details }).toResponse();
}
