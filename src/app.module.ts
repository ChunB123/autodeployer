import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProvisionController } from './provision/controllers/provision.v1.controller';
import { ProvisionModule } from './provision/provision.module';
import { ProvisionService } from './provision/provision.service';
import { DeploymentController } from './deployment/controllers/deployment.v1.controller';
import { DeploymentControllerV2 } from './deployment/controllers/deployment.v2.controller';
import { DeploymentService } from './deployment/deployment.service';
import { DeploymentModule } from './deployment/deployment.module';
import { ClientModule } from './client/client.module';
import { ClientService } from './client/client.service';
import { HttpModule } from '@nestjs/axios';
import { ProvisionControllerV2 } from './provision/controllers/provision.v2.controller';
import { ProvisionDeploymentModule } from './provisionDeployment/provisionDeployment.module';

@Module({
  imports: [
    ProvisionModule,
    DeploymentModule,
    ClientModule,
    HttpModule,
    ProvisionDeploymentModule,
  ],
  controllers: [
    AppController,
    ProvisionController,
    ProvisionControllerV2,
    DeploymentController,
    DeploymentControllerV2,
  ],
  providers: [AppService, ProvisionService, DeploymentService, ClientService],
})
export class AppModule {
  constructor(private readonly clientService: ClientService) {}

  async onModuleInit() {
    await this.clientService.registerService();
  }
}
