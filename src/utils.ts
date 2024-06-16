export class FixedSizeArray<T> {
  private _array: T[] = [];

  constructor(public length: number) {
    this._array = new Array(length);
  }

  public push(value: T) {
    this._array.push(value);

    if (this._array.length > this.length) {
      this._array.shift();
    }
  }

  /**
   * Returns the head of the array
   */
  public get head() {
    return this._array[0];
  }

  /**
   * Returns the tail of the array
   */
  public get tail() {
    return this._array[this._array.length - 1];
  }
}
