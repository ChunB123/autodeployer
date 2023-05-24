import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws/lib";
import * as Eks from "../../../.gen/modules/terraform-aws-modules/aws/eks";
import * as Vpc from "../../../.gen/modules/terraform-aws-modules/aws/vpc";
import * as IamAssumableRoleWithOidc
  from "../../../.gen/modules/terraform-aws-modules/aws/iam/modules/iam-assumable-role-with-oidc";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { AWSStack, eksConfig } from "./aws";


export class EksStack extends AWSStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = new Vpc.Vpc(this, "vpc", {
      name: eksConfig.vpcName,
      cidr: eksConfig.cidr,
      azs: eksConfig.azs,
      privateSubnets: eksConfig.privateSubnets,
      publicSubnets: eksConfig.publicSubnets,
      enableNatGateway: true,
      singleNatGateway: true,
      enableDnsHostnames: true
    });

    interface NodeGroups {
      [key: string]: {
        desired_size: number;
        instance_types: string[];
        max_size: number;
        min_size: number;
        name: string;
      };
    }

    const eks = new Eks.Eks(this, "eks", {
      clusterName: eksConfig.clusterName,
      clusterVersion: "1.24",
      vpcId: vpc.vpcIdOutput,
      subnetIds: vpc.privateSubnetsOutput as any,
      clusterEndpointPublicAccess: true,

      eksManagedNodeGroupDefaults: {
        ami_type: "AL2_x86_64"
      },

      //  desiredSize = amount of node groups (each service has independent node group for auto-scaling)
      eksManagedNodeGroups: (() => {
        const nodeGroups:NodeGroups = {};
        for (let index = 1; index <= eksConfig.desiredSize; index++) {
          nodeGroups[`node-group-${index}`] = {
            desired_size: 1,
            instance_types: ["t3.small"],
            max_size: 2,
            min_size: 1,
            name: `node-group-${index}`
          };
        }
        return nodeGroups;
      })()
    });



    const dataAwsIamPolicyEbsCsiPolicy =
      new aws.dataAwsIamPolicy.DataAwsIamPolicy(this, "ebs_csi_policy", {
        arn: "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
      });

    const irsaEbsCsi = new IamAssumableRoleWithOidc.IamAssumableRoleWithOidc(
      this,
      "irsa-ebs-csi",
      {
        createRole: true,
        oidcFullyQualifiedSubjects: [
          "system:serviceaccount:kube-system:ebs-csi-controller-sa"
        ],
        providerUrl: eks.oidcProviderOutput,
        roleName: `AmazonEKSTFEBSCSIRole-\${${eks.clusterNameOutput}}`,
        rolePolicyArns: [dataAwsIamPolicyEbsCsiPolicy.arn]
      }
    );
    new aws.eksAddon.EksAddon(this, "ebs-csi", {
      addonName: "aws-ebs-csi-driver",
      addonVersion: "v1.5.2-eksbuild.1",
      clusterName: eks.clusterNameOutput,
      serviceAccountRoleArn: irsaEbsCsi.iamRoleArnOutput,
      tags: {
        eks_addon: "ebs-csi",
        terraform: "true"
      }
    });



    new TerraformOutput(this, "cluster_endpoint", {
      value: eks.clusterEndpointOutput
    });

    new TerraformOutput(this, "create_user_arn", {
      value: new DataAwsCallerIdentity(this, "current").arn
    });
  }
}

const app = new App();
const stack = new EksStack(app, "eks_test");

app.synth();
