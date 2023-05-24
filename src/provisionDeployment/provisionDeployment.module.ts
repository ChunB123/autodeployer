import { Module } from '@nestjs/common';
import { ProvisionDeploymentController } from './provisionDeployment.controller';
import { ProvisionDeploymentService } from './provisionDeployment.service';
import { ProvisionService } from 'src/provision/provision.service';
import { DeploymentService } from 'src/deployment/deployment.service';
import { ClientService } from 'src/client/client.service';
import { HttpModule } from '@nestjs/axios';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ClientModule, HttpModule],
  controllers: [ProvisionDeploymentController],
  providers: [
    ProvisionDeploymentService,
    ProvisionService,
    DeploymentService,
    ClientService,
  ],
})
export class ProvisionDeploymentModule {}
