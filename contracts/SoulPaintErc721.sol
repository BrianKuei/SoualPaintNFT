// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract SoulPaintErc721 is ERC721, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using ECDSA for bytes32;

    bool public _isSaleActive = false;
    bool public _isWLSaleActive = false;

    uint256 public MAX_SUPPLY = 1000;
    uint256 public mintPrice = 0.088 ether;
    uint256 public WL_mintPrice = 0.055 ether;
    uint256 public maxBalance = 1000;

    string baseURI;
    string public baseExtension = ".json";
    //tokenURI
    mapping(uint256 => string) private _tokenURIs;

    bytes32 public merkleRoot;

    //funds
    address funds;

    using Counters for Counters.Counter;
    Counters.Counter private _nextTokenId;

    constructor(
        string memory _initBaseURI,
        address receiver,
        uint96 feeNumerator
    ) ERC721("SoulPaintErc721", "SP") {
        setBaseURI(_initBaseURI);
        setDefaultRoyalty(receiver, feeNumerator);
    }

    //modifier
    modifier onlyEOA() {
        require(tx.origin == msg.sender, "caller is not EOA");
        _;
    }
    modifier notExceedMax_Supply(uint256 _tokenQuantity) {
        require(
            totalSupply() + _tokenQuantity <= MAX_SUPPLY,
            "Sale would exceed max supply"
        );
        _;
    }
    modifier saleTime() {
        require(_isSaleActive, "Sale is not active");
        _;
    }
    modifier balance(uint256 _tokenQuantity) {
        require(
            balanceOf(msg.sender) + _tokenQuantity <= maxBalance,
            "Sale would exceed max balance"
        );
        _;
    }

    //mintFunction
    function mint(uint256 _tokenQuantity)
        public
        payable
        nonReentrant
        onlyEOA
        notExceedMax_Supply(_tokenQuantity)
        saleTime
        balance(_tokenQuantity)
    {
        require(
            _tokenQuantity * mintPrice <= msg.value,
            "Not enough ether sent"
        );
        _mint(_tokenQuantity);
    }

    function mint_Owner(uint256 _tokenQuantity)
        public
        payable
        onlyOwner
        onlyEOA
        notExceedMax_Supply(_tokenQuantity)
    {
        _mint(_tokenQuantity);
    }

    //WL
    function isWhitelisted(bytes32[] calldata proof, bytes32 leaf)
        internal
        view
        returns (bool)
    {
        return MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    }

    function mint_WL(uint256 _tokenQuantity, bytes32[] calldata _merkleProof)
        public
        payable
        nonReentrant
        onlyEOA
        notExceedMax_Supply(_tokenQuantity)
        balance(_tokenQuantity)
    {
        require(_isWLSaleActive, "Sale must be active to mint");
        require(
            isWhitelisted(
                _merkleProof,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Must be whitelisted"
        );
        require(
            _tokenQuantity * WL_mintPrice <= msg.value,
            "Not enough ether sent"
        );
        _mint(_tokenQuantity);
    }

    function _mint(uint256 _tokenQuantity) internal {
        // Check non-zero mint
        require(_tokenQuantity > 0, "quantity must be greater 0");
        uint256 currentTokens = totalSupply();
        if (currentTokens + _tokenQuantity < MAX_SUPPLY) {
            for (uint256 i; i < _tokenQuantity; ++i) {
                _nextTokenId.increment();
                _safeMint(msg.sender, currentTokens + i);
            }
        }
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        string memory _tokenURI = _tokenURIs[_tokenId];
        string memory base = _baseURI();
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the _tokenID to the baseURI.
        return
            string(abi.encodePacked(base, _tokenId.toString(), baseExtension));
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId.current();
    }

    //only owner
    function toggleSaleActive() external onlyOwner {
        _isSaleActive = !_isSaleActive;
    }

    function toggleWLSaleActive() external onlyOwner {
        _isWLSaleActive = !_isWLSaleActive;
    }

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        external
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    function setMaxBalance(uint256 _maxBalance) external onlyOwner {
        maxBalance = _maxBalance;
    }

    function withdraw() external onlyOwner nonReentrant {
        payable(funds).transfer(address(this).balance);
    }

    function setfunds(address funds_) external onlyOwner {
        funds = funds_;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function set_MAX_SUPPLY(uint256 _MAX_SUPPLY) external onlyOwner {
        MAX_SUPPLY = _MAX_SUPPLY;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        public
        onlyOwner
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
