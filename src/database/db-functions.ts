import { Job } from './job-model';

export async function getJob(projectId: string, jobId: string): Promise<any> {
  return await Job.findOne({ where: { projectid: projectId, jobid: jobId } });
}

export async function addJob(
  projectId: string,
  jobId: string,
  status: string,
  s3Directory: string,
  volumeId: string,
): Promise<any> {
  try {
    await Job.create({
      projectid: projectId,
      jobid: jobId,
      status: status,
      s3directory: s3Directory,
      volumeid: volumeId,
    });
    console.log('Job Added successfully');
  } catch (error) {
    console.log(`Error adding job: ${error.message}`);
  }
}

export async function updateJob(
  projectId: string,
  jobId: string,
  status: string,
  s3Directory: string,
  volumeId: string,
): Promise<any> {
  return await Job.update(
    {
      status: status,
      s3directory: s3Directory,
      volumeid: volumeId,
    },
    { where: { projectid: projectId, jobid: jobId } },
  );
}
