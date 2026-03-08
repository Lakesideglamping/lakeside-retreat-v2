export class Semaphore {
  private queue: (() => void)[] = [];
  private active = 0;

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

export const bookingSemaphore = new Semaphore(3);
export const paymentSemaphore = new Semaphore(2);
