import { IsEnum, IsString } from 'class-validator';

export enum ResponseStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  INPROGRESS = 'in progress',
  ACCEPTED = 'accepted',
}

export class ProvisionResponse {
  @IsEnum(ResponseStatus)
  status: string;

  @IsString()
  message: string;
}
