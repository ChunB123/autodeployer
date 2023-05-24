export interface StatusBody {
  project_id: string;
  job_id: string;
  service_type: string;
  operation_type: string;
  status: string;
  message: string;
}
