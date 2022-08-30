import { exec, execSync, spawn } from 'child_process';
import path from 'path';

describe.skip('test', () => {
  it('test execSync', () => {
    const cwd = path.resolve(__dirname, '../', 'bin', 'win');
    const cmd = path.relative(__dirname, cwd);
    console.log('cmd', cmd);
    console.log('cwd', cwd);
    const res = execSync(`"./adb.exe" version`, {
      cwd,
    });
    console.log('res', res.toString());
  });
  it('test exec', () =>
    new Promise<void>((resolve, reject) => {
      const cwd = path.resolve(__dirname, '../', 'bin', 'win');
      const cmd = path.relative(__dirname, cwd);
      console.log('cmd', cmd);
      console.log('cwd', cwd);
      const res = exec(`"./adb.exe" version`, {
        cwd,
      });
      res.stderr?.on('data', (err) => {
        console.error(err);
      });
      res!.stdout!.on('data', (data) => {
        console.log('res', data.toString());
        resolve();
      });
    }));

  it('test spawnSync', () => {
    return new Promise<void>((resolve, reject) => {
      const cwd = path.resolve(__dirname, '../', 'bin', 'win');
      const cmd = path.relative(__dirname, cwd);
      console.log('cmd', cmd);
      console.log('cwd', cwd);
      const res = spawn(`./adb.exe`, [`version`], {
        cwd,
      });
      res!.stdout!.on('data', (data) => {
        console.log('res', data.toString());
        resolve();
      });
    });
  });
  it('test spawn', () => {
    const cwd = path.resolve(__dirname, '../', 'bin', 'win');
    const cmd = path.relative(__dirname, cwd);
    console.log('cmd', cmd);
    console.log('cwd', cwd);
    const res = spawn(`"./adb.exe"`, [`version`], {
      cwd,
    });
    console.log('res', res);
  });
});
