# example-pipe
Execute process not allowing to run concurrent jobs of the same nature.
Report on failures and release lock after a determined period.

###### Example Use Case
Used methodology on process like extracting data batches from source (Redis) to data warehouse target (Mysql).

## Project setup
```
npm install
```

#### Execute with verbose flag and custom counter input
```
node index.js -v -c=5
```
