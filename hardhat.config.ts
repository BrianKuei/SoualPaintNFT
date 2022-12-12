import { HardhatUserConfig } from "hardhat/config";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      gas: 'auto',
    }
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true
  }
};

export default config;
