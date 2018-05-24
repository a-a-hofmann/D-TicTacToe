module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    },
 	ropsten: {
        network_id: 3,
        host: '127.0.0.1',
        port: 8545,
        gas: 4700000,
        gasPrice: 22000000000,
        from: '0x1eb07f5ac75ffd269777b77beca5c1916b29a790'
    },
    rinkeby: {
        host: "localhost", // Connect to geth on the specified
        port: 8545,
        from: "0x0085f8e72391Ce4BB5ce47541C846d059399fA6c", // default address to use for any transaction Truffle makes during migrations
        network_id: 4,
        gas: 4612388 // Gas limit used for deploys
    },
    private: {
        host: "localhost",
        port: 8545,
        from: "0xcd21e59b0cd5e89419d27730c268505236c16369",
        network_id: "*",
        gas: 8100000
    }
},
  solc: {
    optimizer: {
        enabled: true,
        runs: 200
    }
},
};

