import { Test, TestingModule } from '@nestjs/testing';
import * as shell_methods from './shell_methods';
import * as fs from 'fs';
import * as path from 'path';

describe('shell_methods', () => {
  let moduleFixture: TestingModule;
  let tempFiles: string[] = [];

  afterAll(async () => {
    // Remove any remaining temporary files after all tests are done
    for (const file of tempFiles) {
      await fs.promises.unlink(file);
    }
  });

  describe('generate_provision_commands', () => {
    it('should generate correct commands array', () => {
      const result = shell_methods.generate_provision_commands('output_jobname');

      expect(result).toEqual([
        `cdktf deploy --auto-approve > output_jobname`,
      ]);
    });
  });

  describe('generate_deployment_commands', () => {
    it('should generate correct commands array for deployment', () => {
      const result = shell_methods.generate_deployment_commands('/A/Valid/Directory', '/Some/Directory/.kube/config', 'output');

      expect(result).toEqual([
        `./src/scripts/kubectl_apply.sh /A/Valid/Directory /Some/Directory/.kube/config > output`,
      ]);
    });
  });

  describe('write_to_file', () => {
    it('should write file with commands', async () => {
      const commands = ['command1', 'command2'];
      const fileName = 'test.txt';
      tempFiles.push(fileName);

      await shell_methods.write_to_file(commands, fileName);

      const fileContents = await fs.promises.readFile(fileName, 'utf-8');

      expect(fileContents).toEqual('command1\ncommand2\n');
    });
  });
});

