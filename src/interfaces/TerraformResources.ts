export interface TerraformResources {
  success: boolean;
  resourcesAdded: number;
  resourcesChanged: number;
  resourcesDestroyed: number;
  ebsVolumeID: string;
  ebsVolumeAvailabilityZone: string;
}
