import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { Request } from './models/request.model';
import { ProvisionDeploymentService } from './provisionDeployment.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller({ path: '/', version: ['1', '2'] })
@ApiTags('ProvisionDeployment')
export class ProvisionDeploymentController {
  constructor(private readonly service: ProvisionDeploymentService) {}

  /**
   * Endpoint for provisioning and deploying a job for a project
   * @param projectId - The ID of the project the job belongs to
   * @param jobId - The ID of the job to provision and deploy
   * @param body - The request body containing details for the request
   */
  @Post(':projectId/jobs/:jobId')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Provision and Deploy Job',
    description: 'Provision infrastructure and deploy services together',
  })
  @ApiParam({
    name: 'projectId',
    description: 'The ID of the project the job belongs to',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The ID of the job to provision and deploy',
  })
  @ApiBody({ type: Request })
  @ApiResponse({ status: 202, description: 'Request Accepted' })
  async createProvision(
    @Param('projectId') projectId: string,
    @Param('jobId') jobId: string,
    @Body() request: Request,
  ) {
    return this.service.newJob(projectId, jobId, request);
  }
}
