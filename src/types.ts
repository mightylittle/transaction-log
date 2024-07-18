/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @remarks
 * A batch of transactions.
 */
export type Commit = {
  /**
   * @remarks
   * Commit creation time: created with `performance.now()` for sub-millisecond precision.
   */
  time: number;
  /**
   * @remarks
   * Array of transaction IDs included in the commit.
   */
  transactions: number[];
}

/**
 * @remarks
 * A batch of transactions, including the commit sequence ID and the transactions.
 * Returned in response to queries.
 */
export type CommitInfo<T> = {
  /**
   * @remarks
   * Sequence ID of the commit.
   */
  id: number;
  /**
   * @remarks
   * Commit creation time: created with `performance.now()` for sub-millisecond precision.
   */
  time: number;
  /**
   * @remarks
   * Array of transactions included in the commit.
   */
  transactions: Transaction<T>[];
}

/**
 * @remarks
 * Transaction log entry.
 */
export type Transaction<T> = {
  /**
   * @remarks
   * Transaction creation time: created with `performance.now()` for sub-millisecond precision.
   */
  time: number;
  /**
   * @remarks
   * Application-specific data.
   */
  data: T;
}

/**
 * @remarks
 * Lifecycle callback functions to be assigned during transaction-log instantiation.
 */
export interface SimpleTransactionLogCallbacks<T> {
  /**
   * @remarks
   * Callback called after opening the transaction-log.
   */
  onopen?: () => void;
  /**
   * @remarks
   * Callback called after closing the transaction-log.
   */
  onclose?: () => void;
  /**
   * @remarks
   * Callback called after clearing the transaction-log.
   */
  onclear?: () => void;
  /**
   * @remarks
   * Callback called after appending to the transaction-log.
   *
   * @param data
   * Application data to write to the transaction-log.
   */
  onappend?: (data: T) => void;
}

/**
 * @remarks
 * Lifecycle callback functions to be assigned during transaction-log instantiation.
 */
export interface BatchedTransactionLogCallbacks<T> extends SimpleTransactionLogCallbacks<T> {
  /**
   * @remarks
   * Callback called after opening the transaction-log.
   */
  onopen?: () => void;
  /**
   * @remarks
   * Callback called after closing the transaction-log.
   */
  onclose?: () => void;
  /**
   * @remarks
   * Callback called after clearing the transaction-log.
   */
  onclear?: () => void;
  /**
   * @remarks
   * Callback called after appending to the transaction-log.
   *
   * @param data
   * Application data to write to the transaction-log.
   */
  onappend?: (data: T) => void;

  /**
   * @remarks
   * Callback called after committing buffered transactions.
   */
  oncommit?: (commit: Commit) => void;
}

/**
 * @remarks
 * Simple transaction-log interface: each entry is committed at the time of append,
 * i.e. not as a batch operation.
 */
export interface SimpleTransactionLog<T> {
  /**
   * @remarks
   * Opens the transaction-log.
   */
  open(): Promise<void>;

  /**
   * @remarks
   * Whether the transaction-log is open.
   */
  isOpen(): Promise<boolean>;

  /**
   * @remarks
   * Closes the transaction-log.
   */
  close(): Promise<void>;

  /**
   * @remarks
   * Clears the closed transaction-log.
   */
  clear(): Promise<void>;

  /**
   * @remarks
   * Resolves to the number of entries in the transaction-log.
   */
  countTransactions(): Promise<number>;

  /**
   * @remarks
   * Appends a transaction to the transaction-log.
   */
  append(data: T): Promise<void>;

  /**
   * @remarks
   * Replays all transactions from the transaction-log.
   *
   * @param callback
   * Function to call once the transaction entry data has been retrieved.
   */
  replay(callback: (data: T) => void): Promise<void>;

  /**
   * @remarks
   * Resolves to all transactions matching a specified sequence-ID range, inclusive.
   * The transaction-log uses 1-based indexing.
   *
   * @param startId
   * Sequence identifier of the initial transaction-entry to include in results (inclusive).
   *
   * @param finishId
   * Sequence identifier of the final transaction-entry to include in results (inclusive).
   */
  getSeqRangeTransactions(startId: number, finishId?: number): Promise<Transaction<T>[]>;
}

/**
 * @remarks
 * Batched transaction-log interface: the log commits batches of transaction entries.
 */
export interface BatchedTransactionLog<T> {
  /**
   * @remarks
   * Opens the transaction-log.
   */
  open(): Promise<void>;

  /**
   * @remarks
   * Whether the transaction-log is open.
   */
  isOpen(): Promise<boolean>;

  /**
   * @remarks
   * Closes the transaction-log.
   */
  close(): Promise<void>;

  /**
   * @remarks
   * Clears the closed transaction-log.
   */
  clear(): Promise<void>;

  /**
   * @remarks
   * Returns the number of commits to the transaction-log.
   */
  countCommits(): Promise<number>;

  /**
   * @remarks
   * Returns the number of transaction-log entries.
   */
  countTransactions(): Promise<number>;

  /**
   * @remarks
   * Commits the entries from the transaction-log buffer.
   */
  commit(): Promise<void>;

  /**
   * @remarks
   * Appends a transaction to the transaction-log buffer.
   */
  append(data: T): void;

  /**
   * @remarks
   * Replays all transactions from the transaction-log.
   *
   * @param callback
   * Function to call once the transaction entry data has been retrieved.
   */
  replay(callback: (data: T) => void): Promise<void>;

  /**
   * @remarks
   * Returns all transactions matching a specified sequence-ID range, inclusive.
   * The transaction-log uses 1-based indexing.
   *
   * @param startId
   * Sequence identifier of the initial transaction-entry to include in results (inclusive).
   *
   * @param finishId
   * Sequence identifier of the final transaction-entry to include in results (inclusive).
   */
  getSeqRangeCommits(startId: number, finishId?: number): Promise<CommitInfo<T>[]>;

  /**
   * @remarks
   * Returns all transactions matching a specified sequence-ID range, inclusive.
   * The transaction-log uses 1-based indexing.
   *
   * @param startId
   * Sequence identifier of the initial transaction-entry to include in results (inclusive).
   *
   * @param finishId
   * Sequence identifier of the final transaction-entry to include in results (inclusive).
   */
  getSeqRangeTransactions(startId: number, finishId?: number): Promise<Transaction<T>[]>;
}
