import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { DeploymentService } from '../deployment.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller({ path: '/deployment', version: '1' })
@ApiTags('Deployment')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post(':projectId/jobs/:jobId')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Deploy Job',
    description: 'Deploy services in the project',
  })
  @ApiParam({
    name: 'projectId',
    description: 'The ID of the project the job belongs to',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The ID of the job to deploy',
  })
  @ApiResponse({ status: 202, description: 'Request Accepted' })
  async createDeployment(
    @Param('projectId') projectId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.deploymentService.deployJob(projectId, jobId);
  }
}
