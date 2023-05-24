import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class DeploymentRequestV2 {
  @ApiProperty({ description: 'Array of deploying files', type: [String] })
  @IsArray()
  deployingFiles: string[];
}
