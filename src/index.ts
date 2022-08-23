import {
  exec,
  execSync,
  spawn,
  ExecSyncOptionsWithStringEncoding,
} from 'child_process';
import { dirname, resolve, relative } from 'path';

const TIMEOUT = 8 * 10000;
const base = resolve(__dirname, '..', 'bin');
const supportedPlatform = ['win32', 'darwin', 'linux'] as const;
type SupportedPlatform = typeof supportedPlatform[number];

export const ADB_BINARY_FILE: Record<SupportedPlatform, string> = {
  win32: resolve(base, 'window/adb.exe'),
  darwin: resolve(base, 'mac/adb'),
  linux: resolve(base, 'linux/adb'),
};

function getAdbFullPath() {
  try {
    return ADB_BINARY_FILE[process.platform as SupportedPlatform];
  } catch (error) {
    throw new Error(
      `Sorry, node-adb not support your system, supported platform has ${supportedPlatform.toString()}\n` +
        error
    );
  }
}

function getAdbReactivePath() {
  try {
    return relative(
      __dirname,
      ADB_BINARY_FILE[process.platform as SupportedPlatform]
    );
  } catch (error) {
    throw new Error(
      `Sorry, node-adb not support your system, supported platform has ${supportedPlatform.toString()}` +
        error
    );
  }
}

/** @description Is there an available ADB in your computer? */
export function isSystemAdbAvailable() {
  try {
    return execSync('adb version')
      .toString()
      .includes('Android Debug Bridge version');
  } catch (e) {
    return false;
  }
}

export type AdbDeviceStatus = 'offline' | 'device' | 'unauthorized';

export const ipRegExp =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(\d+)$/;

function ensureArgs(
  command: string,
  options?: ExecSyncOptionsWithStringEncoding
) {
  let cwd = options?.cwd || process.cwd();
  if (!isSystemAdbAvailable()) {
    let cmd = command.split(' ');
    const binFile = getAdbFullPath();
    const binDir = dirname(binFile);
    cwd = binDir;
    const adbBin = binFile.replace(binDir, '.');
    cmd[0] = `"${adbBin}"`;
    command = cmd.join(' ');
  }
  const res: [string, ExecSyncOptionsWithStringEncoding] = [
    command,
    {
      ...options,
      cwd,
      timeout: options?.timeout || TIMEOUT,
    } as ExecSyncOptionsWithStringEncoding,
  ];
  return res;
}

/** @description return adb devices  */
export async function getAdbDevices() {
  const list: string = await execADBCommandAsync('adb devices');
  return _parseDeviceInfo(list);
  function _parseDeviceInfo(stdout: string) {
    if (!stdout) {
      return [];
    }
    const lines = stdout.replace(/(\n|\r\n){1,}/g, '\n').split('\n');
    const result = lines
      .filter((item, idx) => {
        //删除第0个和空元素
        return idx !== 0 && item !== '';
      })
      .map((item) => {
        const [sn, status] = item.split('\t') as [string, AdbDeviceStatus];
        return { sn, status };
      });
    return result;
  }
}

/**
 *  @description use sync method to run adb commamnd, will return a string
 *  @example execADBCommandSync('adb devices')
 */
export function execADBCommandSync(
  command: string,
  options?: ExecSyncOptionsWithStringEncoding
) {
  return execSync(...ensureArgs(command, options)).toString();
}

/**
 *  @description use async method to run adb commamnd, will return a string
 *  @example execADBCommandAsync('adb devices')
 */
export function execADBCommandAsync(
  command: string,
  options?: ExecSyncOptionsWithStringEncoding & { log?: any }
) {
  return new Promise<string>(async (resolve, reject) => {
    // 超过8s，进程自动退出
    exec(...ensureArgs(command, options), (err, stdout) => {
      if (err) return reject(err);
      const msg = stdout.toString();
      return resolve(msg);
    });
  });
}

/**
 *  @description use exec method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  @example
 *  const lsProcess = execADBCommand('adb shell ls /data/tmp')
 *  lsProcess.stdout.on('data',(data)=>{
 *    console.log(data.toString())
 *  })
 */
export function execADBCommand(
  command: string,
  options?: ExecSyncOptionsWithStringEncoding
) {
  return exec(...ensureArgs(command, options));
}

/**
 *  @description use spawn method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  @example
 *  const lsProcess = spawnADBCommand('adb', ['shell','ls /data/tmp'])
 *  lsProcess.stdout.on('data',(data)=>{
 *    console.log(data.toString())
 *  })
 */
export function spawnADBCommand(
  command: string,
  args: string[],
  options?: ExecSyncOptionsWithStringEncoding
) {
  const [cmd, opts] = ensureArgs(command, options);
  return spawn(cmd, args, opts);
}
