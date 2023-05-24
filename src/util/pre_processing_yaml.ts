import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// A wrapper function to pre-process all yamls in dir_path
export async function pre_processing_yaml(dir_path: string): Promise<void> {
  try {
    await delete_files_with_keyword(dir_path, 'persistentvolumeclaim');
    const files = await locate_yamls_with_volumeMounts(dir_path);
    // only modify and generate yamls when the service needs a volume
    if (files.length > 0) {
      let name = null;
      await Promise.all(
        files.map(async (file) => {
          await add_subPath(file);
          name = await get_volume_name(file);
        }),
      );
      await gen_volume_k8s_yamls(dir_path, name);
    }
  } catch (error) {
    throw new Error(`Failed to pre-process files: ${error.message}`);
  }
}

export async function delete_files_with_keyword(
  dir_path: string,
  keyword: string,
): Promise<void> {
  const files = await fs.readdir(dir_path);
  try {
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir_path, file);

        const fileStat = await fs.stat(filePath);
        if (fileStat.isDirectory()) {
          await delete_files_with_keyword(filePath, keyword);
        } else if (file.includes(keyword)) {
          await fs.unlink(filePath);
        }
      }),
    );
  } catch (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

export async function locate_yamls_with_volumeMounts(
  dir_path: string,
): Promise<string[]> {
  const files = await fs.readdir(dir_path);
  const yaml_arr = [];

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir_path, file);

      const fileStat = await fs.stat(filePath);

      if (fileStat.isDirectory()) {
        await locate_yamls_with_volumeMounts(filePath);
      } else {
        const yamlString = await fs.readFile(filePath, 'utf8');
        const yamlObject = yaml.load(yamlString);
        const volumeMounts =
          yamlObject?.spec?.template?.spec?.containers?.[0]?.volumeMounts ?? [];
        if (volumeMounts.length > 0) {
          // The volumeMounts property exists.
          yaml_arr.push(filePath);
        }
      }
    }),
  );
  return yaml_arr;
}

export async function add_subPath(file_path: string) {
  try {
    // Read the YAML file into a JavaScript object
    const yamlString = await fs.readFile(file_path, 'utf8');
    const yamlObject = yaml.load(yamlString);
    // Modify the object as needed
    yamlObject.spec.template.spec.containers[0].volumeMounts[0].subPath =
      'my-subPath';

    // Write the modified object back to the YAML file
    const modifiedYamlString = yaml.dump(yamlObject);
    await fs.writeFile(file_path, modifiedYamlString, 'utf8');
    console.log('YAML file modified successfully!');
  } catch (error) {
    throw new Error(`Failed to modify YAML file: ${error.message}`);
  }
}
export async function get_volume_name(file_path: string) {
  try {
    const yamlString = await fs.readFile(file_path, 'utf8');
    const yamlObject = yaml.load(yamlString);
    return yamlObject.spec.template.spec.volumes[0].name;
  } catch (error) {
    console.log('Failed to get volume_name');
    throw new Error(`Failed to get volume_name: ${error.message}`);
  }
}

// Generate "ebsStorageClass.yaml" and "pvc_ebs.yaml" for DB persistence.
// dir_path: directory to store the generated yamls
// name: "scrum-data"
export async function gen_volume_k8s_yamls(
  dir_path: string,
  name: string,
): Promise<void> {
  const storageClass = `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: sg
provisioner: ebs.csi.aws.com
volumeBindingMode: Immediate`;

  const persistentVolumeClaim = `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${name}
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: sg
  resources:
    requests:
      storage: 6Gi`;

  try {
    await Promise.all([
      fs.writeFile(path.join(dir_path, `${name}-sc.yaml`), storageClass),
      fs.writeFile(
        path.join(dir_path, `${name}-pvc.yaml`),
        persistentVolumeClaim,
      ),
    ]);
    console.log('YAML file generated successfully!');
  } catch (error) {
    throw new Error(`Failed to generate YAML files: ${error.message}`);
  }
}
