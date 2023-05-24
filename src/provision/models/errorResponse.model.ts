import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from './errors';

export class ErrorResponse extends HttpException {
  constructor(errorCode: ErrorCodes, message: string) {
    super(
      {
        errorCode,
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
