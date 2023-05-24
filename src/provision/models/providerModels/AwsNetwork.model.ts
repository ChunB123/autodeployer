import { Network } from 'src/interfaces/Network';

export class AwsNetwork {
  name: string;
  cidr: string;
  availabilityZones: string[];
  privateSubnets: string[];
  publicSubnets: string[];

  constructor(network: Network) {
    this.name = network.name;
    this.cidr = network.cidr;
    this.availabilityZones = network.availabilityZones;
    this.privateSubnets = network.privateSubnets;
    this.publicSubnets = network.publicSubnets;
  }
}
