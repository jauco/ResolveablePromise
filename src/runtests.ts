import {ResolveablePromise} from "./resolveablepromise"


export function runTests() {
  //tiny async test framework
  let queue = Promise.resolve(true)
  function test(id: string, cb: () => Promise<void>) {
    queue = queue.then(async (result) => {
      try {
        await cb()
      } catch (e) {
        console.error("Test failed: ", JSON.stringify(id))
        console.error(e)
        result = false
      }
      return result
    })
  }

  function assert(a: any, b: any) {
    if (a !== b) {
      throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`)
    }
  }
  //end tiny async test framework

  test("you can await a promise", async () => {
    let sideEffects = ""
    const pr = new ResolveablePromise()
    pr.promise.then(() => sideEffects += "1:")
    await pr.resolve()
    sideEffects += "2:"
    assert(sideEffects, "1:2:")
  })

  test("the nested promise chain will resolve before the promise from the resolve() call itself resolves", async () => {
    let sideEffects = ""
    const pr = new ResolveablePromise()
    pr.promise.then(() => {
      sideEffects += "1:";
      return Promise.resolve().then(() => {
        sideEffects += "2:"
        return Promise.resolve().then(() => {
          sideEffects += "3:"
        })
      })
    }).then(() => sideEffects += "4:")
    await pr.resolve()
    sideEffects += "5:"
    assert(sideEffects, "1:2:3:4:5:")
  })


  test("the Tasks in the nested promise chain will _not_ resolve before the promise from the resolve() call itself resolves", async () => {
    let sideEffects = ""
    const pr = new ResolveablePromise()
    const fullPr = pr.promise.then(() => {
      sideEffects += "1:";
      return new Promise(resolve => setTimeout(resolve, 0))
    }).then(() => sideEffects += "4:")
    await pr.resolve()
    sideEffects += "5:"
    assert(sideEffects, "1:5:")
    await fullPr
    assert(sideEffects, "1:5:4:")
  })


  return queue
}

runTests().then(
  (result) => {
    if (result) {
      console.log("tests passed")
    } else {
      console.log("tests failed!")
    }
  },
  (e) => {console.log("tests failed!", e)}
)
