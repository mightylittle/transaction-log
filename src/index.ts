/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
export type {
  SimpleTransactionLog,
  SimpleTransactionLogCallbacks,
  BatchedTransactionLog,
  BatchedTransactionLogCallbacks,
  Transaction,
  Commit,
  CommitInfo
} from "./types";
export {
  INVALID_SEQUENCE_ID_MESSAGE,
  INVALID_COMMIT_MESSAGE,
  LOG_CLOSED_MESSAGE,
  LOG_ALREADY_OPEN_MESSAGE,
  LOG_ALREADY_CLOSED_MESSAGE,
  LOG_OPEN_CANNOT_CLEAR_MESSAGE,
  BUFFER_EMPTY_CANNOT_COMMIT_MESSAGE,
  UNEXPECTED_CURSOR_VALUE_ERROR_MESSAGE,
  FAILED_TO_COMMIT_TRANSACTIONS_MESSAGE
} from "./error-messages";
export { default as MemorySimpleTransactionLog } from "./MemorySimpleTransactionLog";
export { default as MemoryBatchedTransactionLog } from "./MemoryBatchedTransactionLog";
