/* global process */
export default function logProgress(...transforms) {
  let timeout = null;

  function updateMessage() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const message = transforms.map(t => t.id ? `${t.id}: ${t.count}` : t.count).join(' | ');

    if (process.stdout.cursorTo) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(message);
    } else {
      process.stdout.write(message + '\n');
    }
  }

  for (const t of transforms) {
    t.on('counter', () => {
      if (!timeout) {
        timeout = setTimeout(updateMessage, 50);
      }
    });
  }
  transforms[transforms.length - 1].on('finish', () => {
    updateMessage();
    process.stdout.write('\n');
  });

  updateMessage();
}
