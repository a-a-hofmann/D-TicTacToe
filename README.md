# D-TicTacToe

## Get started

First install truffle:
```bash
npm install -g truffle
```

Then, with a private blockchain running (ganache or geth node), to compile and deploy the smart contract:

```bash
truffle compile
truffle migrate
```

To fetch the dependencies for the web server:

```
npm i
```

To start the web server:

```
npm start
```

To tell truffle to which blockchain it needs to deploy the smart contract, edit the files:
`truffle-config.js` and `truffle.js`.
If using `ganache` everything should already work as it is.
