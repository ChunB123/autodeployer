import { IsArray, IsObject, IsString } from 'class-validator';
import { Credentials } from '../../interfaces/Credentials';
import { Network } from '../../interfaces/Network';
import { Cluster } from '../../interfaces/Cluster';
import { ApiProperty } from '@nestjs/swagger';

export class ProvisionRequest {
  @ApiProperty({ type: Object, description: 'Credentials object' })
  @IsObject()
  credentials: Credentials;

  @ApiProperty({ description: 'Region string' })
  @IsString()
  region: string;

  @ApiProperty({ type: Object, description: 'Network object' })
  @IsObject()
  network: Network;

  @ApiProperty({ type: Object, description: 'Cluster object' })
  @IsObject()
  cluster: Cluster;
}

export class ProvisionRequestV2 {
  @ApiProperty({ description: 'Array of provisioning files', type: [String] })
  @IsArray()
  provisioningFiles: string[];
}
