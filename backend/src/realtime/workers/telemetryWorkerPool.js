const path = require('node:path');
const { Worker } = require('node:worker_threads');
const os = require('node:os');

class TelemetryWorkerPool {
  constructor(size = Math.max(1, Math.min(4, (os.availableParallelism?.() || os.cpus().length) - 1))) {
    this.workers = [];
    this.queue = [];
    this.nextId = 1;
    for (let i = 0; i < size; i += 1) this.addWorker();
  }
  addWorker() {
    const worker = new Worker(path.join(__dirname, 'telemetryWorker.js'));
    const slot = { worker, busy: false, current: null };
    worker.on('message', (message) => {
      const task = slot.current;
      slot.current = null; slot.busy = false;
      if (task) {
        if (message.error) {
          task.reject(new Error(message.error));
        } else {
          const result = Array.isArray(message.result)
            ? message.result.map((item) => ({ ...item, recordedAt: new Date(item.recordedAt) }))
            : message.result;
          task.resolve(result);
        }
      }
      this.dispatch();
    });
    worker.on('error', (error) => {
      if (slot.current) slot.current.reject(error);
      slot.current = null; slot.busy = false;
      this.workers = this.workers.filter((item) => item !== slot);
      this.addWorker(); this.dispatch();
    });
    this.workers.push(slot);
  }
  process(payload) {
    return new Promise((resolve, reject) => {
      this.queue.push({ id: this.nextId++, payload, resolve, reject });
      this.dispatch();
    });
  }
  dispatch() {
    for (const slot of this.workers) {
      if (slot.busy || !this.queue.length) continue;
      const task = this.queue.shift(); slot.busy = true; slot.current = task;
      slot.worker.postMessage({ id: task.id, payload: task.payload });
    }
  }
  async close() { await Promise.all(this.workers.map(({ worker }) => worker.terminate())); }
}
module.exports = new TelemetryWorkerPool();
