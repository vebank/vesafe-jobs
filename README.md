# Safe Jobs #
Run
___
**Record safe-txn**

- Approved:
  ```shell
    Get logs: node --experimental-json-modules ./src/scripts/CronLog.js contract=SAFE abi=safeABI event=ApproveHash task_name=recordSafe exchange=record-txn 
    --reset=true
  ```
    Worker: node ./src/worker.js queue=record-txn-logs task_name=recordSafe exchange=record-txn

  - Execute success:
  ```shell
    Get logs: node --experimental-json-modules ./src/scripts/CronLog.js contract=SAFE abi=safeABI event=ExecutionSuccess task_name=recordSafeExecuted exchange=execute-txn --reset=true
    Worker: node ./src/worker.js queue=execute-txn-logs task_name=recordSafeExecuted exchange=execute-txn
  ```


  - Execute failure:
  ```shell
    Get logs: node --experimental-json-modules ./src/scripts/CronLog.js contract=SAFE abi=safeABI event=ExecutionFailure task_name=recordSafeExecuted exchange=execute-txn --reset=true
    Worker: node ./src/worker.js queue=execute-txn-logs task_name=recordSafeExecuted exchange=execute-txn
  ```

