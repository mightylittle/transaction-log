# @mightylittle/transaction-log

The package defines two exported classes:

* MemorySimpleTransactionLog
* MemoryBatchedTransactionLog

## Usage

### MemorySimpleTransactionLog

JavaScript example:

```javascript
import { MemorySimpleTransactionLog } from "@mightylittle/transaction-log";

async function start () {
  const log = new MemorySimpleTransactionLog();
  await log.open();
  await log.append("foo");
  await log.append("bar");
  await log.countTransactions(); // => 2
  await log.replay((data) => console.log("data", data));
  await console.log("transactions", await log.getSeqRangeTransactions(1, 2)); // returns the first and second entries
  await log.close();
  await log.clear();
}
```

### MemoryBatchedTransactionLog

JavaScript example:

```javascript
import { MemoryBatchedTransactionLog } from "@mightylittle/transaction-log";

async function start () {
  const log = new MemoryBatchedTransactionLog();
  await log.open();
  log.append("foo");
  log.append("bar");
  await log.commit();
  await log.countTransactions(); // => 2
  await log.countCommits(); // => 1
  await log.replay((data) => console.log("data", data), true);
  await console.log("transactions", await log.getSeqRangeTransactions(1, 2)); // prints the first and second entries
  await console.log("commits", await log.getSeqRangeCommits(1)); // prints the first and any later commits
  await log.close();
  await log.clear();
}
```

## Installation

```sh
npm install
```

## Development

Build:

```sh
npm run build
```

Run tests:

```sh
npm run test
```

Generate documentation:

```sh
npm run typedoc
```

## Author

* John Newton

## Copyright

* John Newton

## License

Apache-2.0
