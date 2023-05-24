import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean } from 'class-validator';

export class Request {
  @ApiProperty({
    description: 'Specify if provisioning should be performed',
    type: Boolean,
  })
  @IsBoolean()
  provision: boolean;

  @ApiProperty({ description: 'Array of provisioning files', type: [String] })
  @IsArray()
  provisioningFiles: string[];

  @ApiProperty({
    description: 'Specify if deployment should be performed',
    type: Boolean,
  })
  @IsBoolean()
  deploy: boolean;

  @ApiProperty({ description: 'Array of deploying files', type: [String] })
  @IsArray()
  deployingFiles: string[];
}
