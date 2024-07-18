/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Commit,
  CommitInfo,
  Transaction,
  BatchedTransactionLog,
  BatchedTransactionLogCallbacks
} from "./types";
import {
  INVALID_SEQUENCE_ID_MESSAGE,
  LOG_CLOSED_MESSAGE,
  LOG_ALREADY_OPEN_MESSAGE,
  LOG_ALREADY_CLOSED_MESSAGE,
  LOG_OPEN_CANNOT_CLEAR_MESSAGE,
  BUFFER_EMPTY_CANNOT_COMMIT_MESSAGE,
  INVALID_COMMIT_MESSAGE
} from "./error-messages";

/**
 * @remarks
 * In-memory, non-threadsafe implementation of a batched transaction-log.
 */
export default class MemoryBatchedTransactionLog<T> implements BatchedTransactionLog<T> {
  #commits: Commit[] = [];
  #transactions: Transaction<T>[] = [];
  #buffer: Transaction<T>[] = [];
  #callbacks: BatchedTransactionLogCallbacks<T>;
  #open: boolean = false;

  public constructor(callbacks?: BatchedTransactionLogCallbacks<T>) {
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

    this.#commits = [];
    this.#transactions = [];
    this.#buffer = [];
    this.#callbacks.onclear?.apply(this);
  };

  public async commit(): Promise<void> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    if (this.#buffer.length === 0) {
      throw new Error(BUFFER_EMPTY_CANNOT_COMMIT_MESSAGE);
    };

    const commitId = this.#commits.length + 1;

    const transactionIds = this.#buffer.map((_transaction, i) => this.#transactions.length + i + 1);

    const commit: Commit = {
      time: performance.now(),
      transactions: transactionIds
    };

    this.#commits.push(commit);
    this.#transactions.push(...this.#buffer);
    this.#buffer = [];

    this.#callbacks.oncommit?.apply(this, [commit]);
  };

  public async countCommits(): Promise<number> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    return this.#commits.length;
  };

  public async countTransactions(): Promise<number> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    return this.#transactions.length;
  };

  public append(data: T): void {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    const txn: Transaction<T> = {
      time: performance.now(),
      data
    };

    this.#buffer.push(txn);
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

  public async getSeqRangeCommits(startId: number, finishId?: number): Promise<CommitInfo<T>[]> {
    if (!this.#open) {
      throw new Error(LOG_CLOSED_MESSAGE);
    }

    if (startId < 1) {
      throw new Error(INVALID_SEQUENCE_ID_MESSAGE);
    }

    if (finishId) {
      return this.#commits.slice(startId - 1, finishId)
        .map((commit) => {
          const commitId = this.#commits.indexOf(commit) + 1;

          if (commitId === 0) {
            throw new Error(INVALID_COMMIT_MESSAGE);
          }

          return {
            id: commitId,
            time: commit.time,
            transactions: commit.transactions.map(((transactionId) => this.#transactions[transactionId - 1]))
          };
        });
    } else {
      return this.#commits.slice(startId - 1)
        .map((commit) => {
          const commitId = this.#commits.indexOf(commit) + 1;

          if (commitId === 0) {
            throw new Error(INVALID_COMMIT_MESSAGE);
          }

          return {
            id: commitId,
            time: commit.time,
            transactions: commit.transactions.map(((transactionId) => this.#transactions[transactionId - 1]))
          };
        });
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
