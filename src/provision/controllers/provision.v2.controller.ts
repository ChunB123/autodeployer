import { Controller, Param, Post, Body, HttpCode } from '@nestjs/common';
import { ProvisionService } from '../provision.service';
import { ProvisionRequestV2 } from '../models/request.model';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Controller for handling provision-related API endpoints.
 * Base endpoint: /provision
 */
@Controller({ path: '/provision', version: '2' })
@ApiTags('Provision')
export class ProvisionControllerV2 {
  constructor(private readonly provisionService: ProvisionService) {}

  /**
   * Endpoint for provisioning a job for a project
   * @param projectId - The ID of the project to provision the job for
   * @param jobId - The ID of the job to provision
   * @param body - The request body containing details for the provision request
   * @returns A promise that resolves with the provision response
   */
  @Post(':projectId/jobs/:jobId')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Provision Job',
    description: 'Provision infrastructure for a new job',
  })
  @ApiParam({
    name: 'projectId',
    description: 'The ID of the project the job belongs to',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The ID of the job to provision',
  })
  @ApiBody({ type: ProvisionRequestV2 })
  @ApiResponse({ status: 202, description: 'Request Accepted' })
  async createProvision(
    @Param('projectId') projectId: string,
    @Param('jobId') jobId: string,
    @Body() provisionRequest: ProvisionRequestV2,
  ) {
    return this.provisionService.provisionJobV2(
      projectId,
      jobId,
      provisionRequest,
    );
  }
}
