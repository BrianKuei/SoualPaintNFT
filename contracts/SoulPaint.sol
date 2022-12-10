// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "erc721psi/contracts/ERC721Psi.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SoulPaint is ERC721Psi, Ownable, ReentrancyGuard {
    constructor() ERC721Psi("SoulPaint", "SP") {}

}