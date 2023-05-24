import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionDeploymentController } from './provisionDeployment.controller';

describe('ProvisionDeploymentController', () => {
  let controller: ProvisionDeploymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvisionDeploymentController],
    }).compile();

    controller = module.get<ProvisionDeploymentController>(
      ProvisionDeploymentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
