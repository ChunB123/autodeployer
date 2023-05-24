import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionDeploymentService } from './provisionDeployment.service';

describe('ProvisionDeploymentService', () => {
  let service: ProvisionDeploymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvisionDeploymentService],
    }).compile();

    service = module.get<ProvisionDeploymentService>(ProvisionDeploymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
