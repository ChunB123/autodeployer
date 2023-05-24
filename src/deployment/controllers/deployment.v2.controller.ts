import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { DeploymentService } from '../deployment.service';
import { DeploymentRequestV2 } from '../models/request.model';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller({ path: '/deployment', version: '2' })
@ApiTags('Deployment')
export class DeploymentControllerV2 {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post(':projectId/jobs/:jobId')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Deploy Job',
    description: 'Deploy services in the project',
  })
  @ApiBody({ type: DeploymentRequestV2 })
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
    @Body() deploymentRequest: DeploymentRequestV2,
  ) {
    return this.deploymentService.deployJobV2(
      projectId,
      jobId,
      deploymentRequest,
    );
  }
}
