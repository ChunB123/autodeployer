import { Cluster } from 'src/interfaces/Cluster';

export class AwsCluster {
  name: string;
  desiredSize: number;

  constructor(cluster: Cluster) {
    this.name = cluster.name;
    this.desiredSize = cluster.desiredSize;
  }
}
