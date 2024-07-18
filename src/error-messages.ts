/*
 * Copyright (c) 2024 John Newton
 * SPDX-License-Identifier: Apache-2.0
 */
export const INVALID_SEQUENCE_ID_MESSAGE = "Invalid sequence-ID: sequences start with 1.";
export const LOG_CLOSED_MESSAGE = "Cannot perform operation: transaction-log is closed.";
export const LOG_ALREADY_OPEN_MESSAGE = "Transaction-log is already open.";
export const LOG_ALREADY_CLOSED_MESSAGE = "Transaction-log is already closed.";
export const LOG_OPEN_CANNOT_CLEAR_MESSAGE = "Transaction-log is open; cannot clear.";
export const BUFFER_EMPTY_CANNOT_COMMIT_MESSAGE = "The transaction buffer is empty; cannot commit."
export const INVALID_COMMIT_MESSAGE = "Invalid commit.";
export const UNEXPECTED_CURSOR_VALUE_ERROR_MESSAGE = "Unexpected cursor value.";
export const FAILED_TO_COMMIT_TRANSACTIONS_MESSAGE = "Failed to commit transactions.";
