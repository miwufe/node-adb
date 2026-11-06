import { vi, type Mock } from 'vitest';
import { execAdbCmdAsync } from '../src/core';
import { getAdbDevices } from '../src/device';
import { AdbTimeoutError, DEFAULT_ADB_DEVICES_TIMEOUT_MS } from '../src';

vi.mock('../src/core', async () => {
  const actual = await vi.importActual<typeof import('../src/core')>('../src/core');
  return { ...actual, execAdbCmdAsync: vi.fn() };
});

const execMock = execAdbCmdAsync as unknown as Mock;

describe('getAdbDevices timeout bound', () => {
  beforeEach(() => {
    execMock.mockReset();
    execMock.mockResolvedValue('List of devices attached\nemulator-5554\tdevice\n');
  });

  it('bounds the call by default so a wedged adb server cannot hang the caller forever', async () => {
    await getAdbDevices();

    const [command, options] = execMock.mock.calls[0];
    expect(command).toBe('adb devices');
    expect(options.timeoutMs).toBe(DEFAULT_ADB_DEVICES_TIMEOUT_MS);
    expect(options.timeoutMs).toBeGreaterThan(0);
  });

  it('honours a tighter bound, which pollers need', async () => {
    await getAdbDevices({ timeoutMs: 3000 });

    expect(execMock.mock.calls[0][1].timeoutMs).toBe(3000);
  });

  it('propagates AdbTimeoutError instead of resolving to an empty device list', async () => {
    // An empty list is indistinguishable from "every device is gone", which
    // would make liveness pollers tear down healthy sessions.
    execMock.mockRejectedValue(new AdbTimeoutError('timed out', 'adb devices', 3000));

    await expect(getAdbDevices({ timeoutMs: 3000 })).rejects.toBeInstanceOf(AdbTimeoutError);
  });

  it('still parses the device list on the happy path', async () => {
    const devices = await getAdbDevices();

    expect(devices).toEqual([{ sn: 'emulator-5554', status: 'device' }]);
  });
});
