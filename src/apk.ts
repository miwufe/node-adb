import { execAdbCmdAsync } from './core';

export async function warpExecAdbCmdAsync(cmd: string) {
  try {
    const res = await execAdbCmdAsync(cmd);
    return {
      status: true,
      msg: res,
    };
  } catch (error) {
    return {
      status: false,
      msg: (error as Error).toString(),
    };
  }
}

export async function isApkInstalled(sn: string, apkName: string) {
  const res = await warpExecAdbCmdAsync(`adb -s ${sn} shell pm path ${apkName}`);
  res.status = res.msg.includes('package:');
  return res;
}

export function installApk(sn: string, apkPath: string) {
  return warpExecAdbCmdAsync(`adb -s ${sn} install ${apkPath}`);
}

export async function uninstallApk(sn: string, apkName: string) {
  return warpExecAdbCmdAsync(`adb -s ${sn} uninstall ${apkName}`);
}
