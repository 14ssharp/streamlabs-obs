import test from 'ava';
import { Application } from 'spectron';

const path = require('path');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');

export function useSpectron() {
  test.beforeEach(async t => {
    t.context.cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slobs-test'));
    t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: ['.'],
      env: {
        NODE_ENV: 'test',
        SLOBS_CACHE_DIR: t.context.cacheDir
      }
    });

    await t.context.app.start();

    // Wait up to 2 seconds before giving up looking for an element.
    // This will slightly slow down negative assertions, but makes
    // the tests much more stable, especially on slow systems.
    t.context.app.client.timeouts('implicit', 2000);
  });

  test.afterEach.always(async t => {
    await t.context.app.stop();
    setTimeout(() => {
      rimraf.sync(t.context.cacheDir);
    }, 1000);
  });
}


async function focusWindow(t, regex) {
  const handles = await t.context.app.client.windowHandles();

  for (const handle of handles.value) {
    await t.context.app.client.window(handle);
    const url = await t.context.app.client.getUrl();
    if (url.match(regex)) return;
  }
}


// Focuses the main window
export async function focusMain(t) {
  await focusWindow(t, /index\.html$/);
}


// Focuses the child window
export async function focusChild(t) {
  await focusWindow(t, /child=true/);
}
