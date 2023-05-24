import {
  gen_volume_k8s_yamls,
  add_subPath,
  delete_files_with_keyword,
  locate_yamls_with_volumeMounts,
  pre_processing_yaml, get_volume_name
} from "./pre_processing_yaml";
import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('pre_processing_yaml', () => {
  it('pre-processes YAML files correctly', async () => {
    const dir_path = path.join(__dirname, 'test/gen_yaml');
    //const dir_path = path.join(__dirname, 'test/redis_yamls');
    const name = 'scrum-data';
    // Test the function
    await pre_processing_yaml(dir_path);

    const filesAfterProcessing = await fs.readdir(dir_path);

    // Expect that none of the file names contain the string "persistentvolumeclaim"
    for (const file of filesAfterProcessing) {
      expect(file).not.toMatch(/persistentvolumeclaim/);
    }
  });
});
describe('delete_files_with_keyword', () => {
  const testDir = path.join(__dirname, 'test/gen_yaml');

  beforeEach(async () => {
    await fs.writeFile(path.join(testDir, 'persistentvolumeclaim1.yaml'), 'Test file 1');
  });

  it('deletes all files containing "persistentvolumeclaim" in the name', async () => {
    await delete_files_with_keyword(testDir, 'persistentvolumeclaim');
    const files = await fs.readdir(testDir);
    expect(files.includes('persistentvolumeclaim1.yaml')).toBe(false);
  });
});

describe('locate_yamls_with_volumeMounts', () => {
  it('finds YAML files with volumeMounts property', async () => {
    const testDir = path.join(__dirname, 'test/gen_yaml');
    // Test the function
    const yamlFiles = await locate_yamls_with_volumeMounts(testDir);

    // Expect only the YAML file with volumeMounts to be found
    expect(yamlFiles).toEqual([path.join(testDir, "scrum-postgres-deployment.yaml")]);
  });
});

describe('add_subPath', () => {
  const filePath = path.join(__dirname, 'test/gen_yaml/scrum-postgres-deployment.yaml');
  it('modifies the YAML file as expected', async () => {
    await add_subPath(filePath);

    // Verify that the YAML file was modified correctly
    const modifiedYamlString = await fs.readFile(filePath, 'utf8');
    const modifiedYamlObject = yaml.load(modifiedYamlString);
    expect(modifiedYamlObject.spec.template.spec.containers[0].volumeMounts[0].subPath).toBe('my-subPath');
  });

  it('handles errors during modification', async () => {
    // Make the file path invalid to force an error
    const invalidFilePath = __dirname;
    await expect(add_subPath(invalidFilePath)).rejects.toThrow();
  });
});

describe('get_volume_name', () => {
  const filePath = path.join(__dirname, 'test/gen_yaml/scrum-postgres-deployment.yaml');
  it('get the volume_name as expected', async () => {
    const volume_name = await get_volume_name(filePath);

    // Verify that the volume_name is returned correctly
    expect(volume_name).toBe('scrum-data');
  });

  it('handles errors', async () => {
    // This file has no volume_name
    const invalidFilePath = path.join(__dirname, 'test/gen_yaml/scrum-postgres-service.yaml');
    await expect(get_volume_name(invalidFilePath)).rejects.toThrow();
  });
});

//E2E test: run kubectl apply -f . in the gen_yaml to verify the yamls
describe('gen_volume_k8s_yaml', () => {
  const dir_path = path.join(__dirname, 'test/gen_yaml');
  const name = 'scrum-data';
  //const volumeID = 'aws://us-east-2a/vol-04f7b732e52d15df1';

  test('generates YAML files', async () => {
    await gen_volume_k8s_yamls(dir_path, name);

    // Verify that the files were generated
    const [scFile, pvcFile] = await Promise.all([
      fs.readFile(path.join(dir_path, `${name}-sc.yaml`), 'utf8'),
      fs.readFile(path.join(dir_path, `${name}-pvc.yaml`), 'utf8'),
    ]);
    expect(pvcFile).toContain(name);
  });
});
