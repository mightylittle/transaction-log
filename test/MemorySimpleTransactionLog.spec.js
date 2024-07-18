/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
import { assert } from "chai";
import { fake, match, spy } from "sinon";
import { describe, it, beforeEach, afterEach } from "mocha";
import { MemorySimpleTransactionLog } from "@mightylittle/transaction-log";

describe("MemorySimpleTransactionLog", () => {
  let log;

  beforeEach(() => {
    log = new MemorySimpleTransactionLog();
  });

  afterEach(() => {
    log.close();
    log.clear();
  });

  it("opens and closes the transaction-log", async () => {
    assert.isUndefined(await log.open());
    assert.isUndefined(await log.close());
  });

  it("'open()' throws an error if the transaction-log is already open", async () => {
    assert.isUndefined(await log.open());

    let thrownError;

    try {
      await log.open();
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'close()' throws an error if the transaction-log is already closed", async () => {
    assert.isUndefined(await log.open());
    assert.isUndefined(await log.close());

    let thrownError;

    try {
      await log.close();
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'append()' resolves to undefined, appending a transaction to the log", async () => {
    await log.open();
    assert.isUndefined(await log.append({type: "move", x: 2, y: 1}));
  });

  it("'append()' throws an error when the transaction-log is closed", async () => {
    await log.open();
    await log.close();

    let thrownError;

    try {
      await log.append({type: "move", x: 2, y: 1});
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'countTransactions()' resolves to the number of entries appended to the log", async () => {
    await log.open();

    assert.isUndefined(await log.append({type: "move", x: 2, y: 1}));
    assert.isUndefined(await log.append({type: "move", x: 2, y: 1}));

    const count = await log.countTransactions();

    assert.equal(count, 2);
  });

  it("'countTransactions()' throws an error when the log is closed", async () => {
    let thrownError;

    try {
      await log.countTransactions();
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'clear()' throws an error if the transaction-log is open", async () => {
    assert.isUndefined(await log.open());

    let thrownError;

    try {
      await log.clear();
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'clear()' resets the log", async () => {
    assert.isUndefined(await log.open());
    assert.isUndefined(await log.append({type: "move", x: 2, y: 1}));
    assert.isUndefined(await log.append({type: "move", x: 1, y: 1}));
    assert.isUndefined(await log.append({type: "move", x: 0, y: 1}));
    assert.isUndefined(await log.close());
    assert.isUndefined(await log.clear());
    await log.open();
    const count = await log.countTransactions();
    assert.equal(count, 0);
  });

  it("'replay()' iterates over the transaction-log entries, calling the provided function", async () => {
    await log.open();

    const moveZero = {type: "move", player: 1, x: 2, y: 1};
    const moveOne = {type: "move", player: 2, x: 1, y: 2};
    const moveTwo = {type: "move", player: 1, x: 0, y: 1};

    await log.append(moveZero);
    await log.append(moveOne);
    await log.append(moveTwo);

    const entries = [];

    await log.replay((entry) => {
      entries.push(entry);
    });

    assert.lengthOf(entries, 3);

    const [first, second, third] = entries;

    assert.strictEqual(first, moveZero);
    assert.strictEqual(second, moveOne);
    assert.strictEqual(third, moveTwo);
  });

  it("'replay()' throws an error when the transaction-log is closed", async () => {
    await log.open();

    const moveZero = {type: "move", player: 1, x: 2, y: 1};
    const moveOne = {type: "move", player: 2, x: 1, y: 2};
    const moveTwo = {type: "move", player: 1, x: 0, y: 1};

    await log.append(moveZero);
    await log.append(moveOne);
    await log.append(moveTwo);

    const entries = [];

    await log.close();

    let thrownError;

    try {
      await log.replay((entry) => {
        entries.push(entry);
      });
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });

  it("'getSeqRangeTransactions()' resolves to the entries within the given range", async () => {
    await log.open();

    const moveZero = {type: "move", player: 1, x: 2, y: 1};
    const moveOne = {type: "move", player: 2, x: 1, y: 2};
    const moveTwo = {type: "move", player: 1, x: 0, y: 1};
    const moveThree = {type: "move", player: 2, x: 0, y: 2};

    await log.append(moveZero);
    await log.append(moveOne);
    await log.append(moveTwo);
    await log.append(moveThree);

    const entries = await log.getSeqRangeTransactions(2, 3);
    assert.lengthOf(entries, 2);
    const [first, second] = entries;
    assert.deepStrictEqual(first.data, moveOne);
    assert.deepStrictEqual(second.data, moveTwo);

    await log.close();
  });

  it("'getSeqRangeTransactions()' without a finishId resolves to all entries started with the startId", async () => {
    await log.open();

    const moveZero = {type: "move", player: 1, x: 2, y: 1};
    const moveOne = {type: "move", player: 2, x: 1, y: 2};
    const moveTwo = {type: "move", player: 1, x: 0, y: 1};
    const moveThree = {type: "move", player: 2, x: 0, y: 2};

    await log.append(moveZero);
    await log.append(moveOne);
    await log.append(moveTwo);
    await log.append(moveThree);

    const entries = await log.getSeqRangeTransactions(2);

    assert.lengthOf(entries, 3);
    const [first, second, third] = entries;
    assert.deepStrictEqual(first.data, moveOne);
    assert.deepStrictEqual(second.data, moveTwo);
    assert.deepStrictEqual(third.data, moveThree);

    await log.close();
  });

  it("'getSeqRangeTransactions()' throws an error when the transaction-log is closed", async () => {
    await log.open();

    const moveZero = {type: "move", player: 1, x: 2, y: 1};
    const moveOne = {type: "move", player: 2, x: 1, y: 2};
    const moveTwo = {type: "move", player: 1, x: 0, y: 1};
    const moveThree = {type: "move", player: 2, x: 0, y: 2};

    await log.append(moveZero);
    await log.append(moveOne);
    await log.append(moveTwo);
    await log.append(moveThree);

    await log.close();

    let thrownError;

    try {
      const _entries = await log.getSeqRangeTransactions(2, 3);
    } catch(error) {
      thrownError = error;
    }

    assert.instanceOf(thrownError, Error);
  });
});
