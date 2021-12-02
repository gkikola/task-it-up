import _ from 'lodash';
import { v4 as uuid } from 'uuid';

class TaskList {
  #tasks;

  constructor() {
    this.#tasks = new Map();
  }

  addTask(task) {
    // Generate UUID (loop just in case there's a collision)
    let id;
    do {
      id = uuid();
    } while (this.#tasks.has(id));

    // Add task to task map
    this.#tasks.set(id, _.cloneDeep(task));
  }
}

export default TaskList;
