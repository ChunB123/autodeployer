import { Module } from '@nestjs/common';
import { DeploymentController } from './controllers/deployment.v1.controller';
import { DeploymentControllerV2 } from './controllers/deployment.v2.controller';
import { DeploymentService } from './deployment.service';
import { ClientModule } from 'src/client/client.module';
import { HttpModule } from '@nestjs/axios';
import { ClientService } from 'src/client/client.service';

@Module({
  imports: [ClientModule, HttpModule],
  controllers: [DeploymentController, DeploymentControllerV2],
  providers: [DeploymentService, ClientService],
})
export class DeploymentModule {}
