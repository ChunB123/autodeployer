import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { EbsVolume } from '@cdktf/provider-aws/lib/ebs-volume';
import { Instance } from "@cdktf/provider-aws/lib/instance";
import * as fs from "fs";
import { EksConfigModel } from "./eksConfigModel";

export const eksConfig: EksConfigModel = JSON.parse(fs.readFileSync('./data/provision_config.json', 'utf8'));
export class AWSStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: eksConfig.region,
      accessKey: eksConfig.accessKey,
      secretKey: eksConfig.secretKey,
      token: eksConfig.token,
    });

    const ebsVolume = new EbsVolume(this, 'ebsVolume', {
      availabilityZone: eksConfig.azs[0],
      size: 5,
      type: 'gp2',
    });

    new TerraformOutput(this, "ebsVolume_id", {
      value: ebsVolume.id
    });

    new TerraformOutput(this, "ebsVolume_availabilityZone", {
      value: ebsVolume.availabilityZone
    });


  }
}
