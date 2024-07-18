/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Transaction,
  SimpleTransactionLog,
  SimpleTransactionLogCallbacks
} from "./types";
import {
  INVALID_SEQUENCE_ID_MESSAGE,
  LOG_CLOSED_MESSAGE,
  LOG_ALREADY_OPEN_MESSAGE,
  LOG_ALREADY_CLOSED_MESSAGE,
  LOG_OPEN_CANNOT_CLEAR_MESSAGE
} from "./error-messages";

/**
 * @remarks
 * In-memory, non-threadsafe implementation of a "simple" transaction-log: each entry is committed
 * at the time of append, i.e. not as a batch operation.
 */
export default class MemorySimpleTransactionLog<T> implements SimpleTransactionLog<T> {
  #transactions: Transaction<T>[] = [];
  #callbacks: SimpleTransactionLogCallbacks<T>;
  #open: boolean = false;

  public constructor(callbacks?: SimpleTransactionLogCallbacks<T>) {
    this.#callbacks = callbacks || {};
  };

  public async isOpen(): Promise<boolean> {
    return this.#open;
  };

  public async open(): Promise<void> {
    if (this.#open) {
      throw new Error(LOG_ALREADY_OPEN_MESSAGE)
    }

    this.#open = true
    this.#callbacks.onopen?.apply(this);
  };

  public async close(): Promise<void> {
    if (!this.#open) {
      throw new Error(LOG_ALREADY_CLOSED_MESSAGE);
    }

    this.#open = false;
    this.#callbacks.onclose?.apply(this);
  };

  public async clear(): Promise<void> {
    if (this.#open) {
      throw new Error(LOG_OPEN_CANNOT_CLEAR_MESSAGE);
    }

    this.#transactions = [];
    this.#callbacks.onclear?.apply(this);
  };

  public async countTransactions(): Promise<number> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    return this.#transactions.length;
  };

  public async append(data: T): Promise<void> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    const txn: Transaction<T> = {
      time: performance.now(),
      data
    };

    this.#transactions.push(txn);
    this.#callbacks.onappend?.apply(this, [data]);
  };

  public async replay(callback: (data: T) => void, simulateTime?: boolean): Promise<void> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE)
    }

    if (simulateTime) {
      const transactionsLength = this.#transactions.length;
      for (let i = 0; i < transactionsLength; i++) {
        const txn = this.#transactions[i];
        const nextTxn = this.#transactions[i + 1];

        if (nextTxn) {
          const start = performance.now();
          callback(txn.data);
          const finish = performance.now();
          setTimeout(() => {}, nextTxn.time - txn.time - (finish - start));
        } else {
          callback(txn.data);
        }
      }
    } else {
      for (const txn of this.#transactions) {
        callback(txn.data);
      }
    }
  };

  public async getSeqRangeTransactions(startId: number, finishId?: number): Promise<Transaction<T>[]> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    if (startId < 1) {
      throw new Error(INVALID_SEQUENCE_ID_MESSAGE);
    }

    if (finishId) {
      return this.#transactions.slice(startId - 1, finishId);
    } else {
      return this.#transactions.slice(startId - 1);
    }
  };
};
