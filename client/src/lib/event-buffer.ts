// Fixed-capacity ring buffer. Drops oldest on overflow.

export class EventBuffer<T> {
  private items: T[] = [];
  constructor(public readonly capacity: number) {
    if (capacity <= 0) throw new Error("EventBuffer capacity must be > 0");
  }
  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) {
      this.items.splice(0, this.items.length - this.capacity);
    }
  }
  toArray(): T[] {
    return this.items.slice();
  }
  size(): number {
    return this.items.length;
  }
  clear(): void {
    this.items = [];
  }
}
