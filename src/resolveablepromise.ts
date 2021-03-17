// MIT License
//
// Copyright (c) 2021 Jauco Noordzij (https://github.com/jauco/ResolveablePromise)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * A class that generates a promise that can be resolved externally.
 *
 * @example
 *
 * class MySystem {
 *   public result: string
 *   constructor(private DI: {callAPIMethod(): Promise<string>}) {}
 *   ping() {
 *     this.DI.callAPIMethod().then(v => this.result = v);
 *   }
 * }
 * //the system should always return the latest API response
 * const promiseStubs: ResolveablePromise<string>[] = []
 * const someSystemUnderTest = new MySystem({
 *   callAPIMethod() { const pr = new ResolveablePromise<string>; promiseStubs.push(pr); return pr.promise; }
 * })
 * someSystemUnderTest.ping()
 * someSystemUnderTest.ping()
 * //Oh oh! Out of order responses
 * promiseStubs[1].resolve("API result 1")
 * promiseStubs[0].resolve("API result 1")
 */
export class ResolveablePromise<T = void> {
  promise!: Promise<T>;
  resolve!: (arg: T) => Promise<void>;
  reject!: <Err>(arg: Err) => Promise<void>;

  constructor() {
    this.reInitPromise();
  }

  private reInitPromise() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (arg: T) => {
        this.reInitPromise();
        resolve(arg);
        //Settimeout enqueues the resolve call as a Task (rather than the microtask that Promise.resolve() would generate)
        //So this means that first all microtasks will be handled including any microtasks that they added to the queue.
        //Only once it is fully drained will this promise resolve.
        //This is not foolproof though, If your code under test creates a Task itself then they will resolve after this one.
        //therefore you should make sure that any Task creating code (fetch, setTimeout etc) is injected and under the control of your test
        // return new Promise((resolve) => setTimeout(resolve, 0));

        //We could improve this by returning a proxied promise so that we can be aware of all the then() calls
        return new Promise((resolve) => setTimeout(resolve, 0));
      };
      this.reject = <Err>(arg: Err) => {
        this.reInitPromise();
        reject(arg);
        return new Promise((resolve) => setTimeout(resolve, 0));
      };
    });
  }
}
