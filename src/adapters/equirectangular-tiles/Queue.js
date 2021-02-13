/* eslint-disable max-classes-per-file */

/**
 * @summary Loading task
 * @memberOf PSV.adapters.EquirectangularSlicesAdapter
 * @private
 */
export class Task {

  static STATUS = {
    PENDING  : 0,
    RUNNING  : 1,
    CANCELLED: 2,
    DONE     : 3,
    ERROR    : 4,
  };

  /**
   * @param {string} id
   * @param {number} priority
   * @param {function(): Promise} fn
   */
  constructor(id, priority, fn) {
    this.id = id;
    this.priority = priority;
    this.fn = fn;
    this.status = Task.STATUS.PENDING;
  }

  start() {
    this.status = Task.STATUS.RUNNING;
    return this.fn()
      .then(() => {
        this.status = Task.STATUS.DONE;
      }, () => {
        this.status = Task.STATUS.ERROR;
      });
  }

  cancel() {
    // TODO
    this.status = Task.STATUS.CANCELLED;
  }

}

/**
 * @summary Loading queue
 * @memberOf PSV.adapters.EquirectangularSlicesAdapter
 * @private
 */
export class Queue {

  /**
   * @param {int} concurency
   */
  constructor(concurency) {
    this.concurency = concurency;
    this.runningTasks = {};
    this.tasks = {};
  }

  enqueue(task) {
    this.tasks[task.id] = task;
  }

  clear() {
    // clear tasks object before cancel to avoid auto-restart
    const tasks = Object.values(this.tasks);
    this.tasks = {};
    this.runningTasks = {};
    tasks.forEach(task => task.cancel());
  }

  setPriority(taskId, priority) {
    if (this.tasks[taskId]) {
      this.tasks[taskId].priority = priority;
    }
  }

  setAllPriorities(priority = 0) {
    Object.values(this.tasks).forEach((task) => {
      task.priority = priority;
    });
  }

  start() {
    if (Object.keys(this.runningTasks).length >= this.concurency) {
      return;
    }

    const nextTask = Object.values(this.tasks)
      .filter(task => task.status === Task.STATUS.PENDING && task.priority > 0)
      .sort((a, b) => a.priority - b.priority)
      .pop();

    if (nextTask) {
      this.runningTasks[nextTask.id] = true;

      nextTask.start()
        .then(() => {
          delete this.tasks[nextTask.id];
          delete this.runningTasks[nextTask.id];
          this.start();
        });

      this.start(); // start tasks until max concurrency is reached
    }
  }

}
