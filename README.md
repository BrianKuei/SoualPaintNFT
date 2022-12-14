# Soul Paint Project

## 產品簡述
《心靈畫作（Soul Painting, SP）》是由《心靈筆記（Soul Note）》以及數名台灣成員組成之團隊所發展潛意識藝術品項目，其藝術品皆經由催眠師催眠後所發展之潛意識夢境畫作，並發展之原生非同質化代幣（Non-Fungible Token, NFT）以及版畫（Print）。

本項目致力為身心理健康、文化藝術資產及區塊鏈建立橋梁，憑藉催眠與 NLP 技術所產生之潛意識夢境，並根據美國藝術印刷標準進行藝術創作，且結合區塊鏈技術建立 NFT 以及根據國際標準創作版畫進行發行與推廣，致力推廣與改善人們身心理健康，打造充滿文化藝術之線上與線下環境。

## 技術說明
ERC721Psi 是使用 Bitmap 和 De Bruijn Sequence（德布魯因數列）來達成節省 gas 的合約

### Bitmap：
這裡使用一個 uint8 的變數和搭配 bitmap 的方式來記錄他們有沒有被 mint。 因為 uint8 變數以二進位表示剛好有 3 bit ( 000 )。當每一個 bit 為 0 的時候我們可以視為沒有被 mint，當 bit 為 1 可以視為已經被 mint 出來了。上面那張圖表示 #1 NFT 已經被 mint 出來了，#2 和 #3 還沒有，此時 uint8變數值為 4 (十進位）。下面那張圖的 uint8變數值為 5 （十進位），表示 #1 和 #3 皆都 mint 出來，唯獨 #2 還沒有。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/1.png)

### De Bruijn Sequence：
是指有某種特性的數列。當這個數列是由 k 種字母組成，給定長度為 n 的連續子數列，總長度為 k^n 。每一種子數列裡面的組合皆不一樣，這種數列我們就稱之為 De Bruijn Sequence （標示成 B(k, n)）。舉例來說，我們設定 k= 2 ，字母就選 0 和 1 表示。n = 3：代表連續子數列長為 3。整個數列長度會是 2³ = 8。 數列 00010111 就剛好是符合這些條件的其中一種 de Brujin Sequence。由下圖可以發現每個 sub-sequence 都是不同的排列組合。若把他們轉成數字會發現每個 sub-sequence 都會對應一個唯一數字。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/2.png)

在 code 中找出 batchHeader 即可找到 owner

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/3.png)

主要的 function 是 BitMaps.sol 的 scanForward(uint256 index)，index 是指 tokenId。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/4.png)

uint256 bucketIndex = (index & off) 把 index 除與 256 來獲得此 tokenId 會是放在哪一個 bucket。一個 bucket 是以 256 為一個單位（表示存放了 256 tokenId 的 owner)。 uint256 bucketIndex = (index & 0xff) 計算出在該 bucket 中這個 tokenId 對應的位置。 bb = bb >> (0xff ^ bucketIndex) 是將要查詢的 tokenId 對應的 bitmap 移到最右邊。情形會如同下圖所示。Batch Head 就是我們要找該 tokenId 的 owner。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/5.png)

第 9、20 行的 bitScanForward256 使用的 isolateLS1B256，幫我們的 tokenId 往左邊第一個 bit 為 1 的位置留下來，其他都設成 0 

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/6.png)

如同下圖所示，除了從右邊數來第一個 1 的位置是 1 之外，其他都為 0 。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/7.png)

圖中可以發現距離 1 的位置有三個間隔，所以表示我們需要往右移動三次。我們就可以用到 De Bruijn Sequence，就能不移動三次來知道 1 的位置。

利用 De Bruijn Sequence 快速找出與 LS1B 的距離：
De Bruijn Sequence 就以前面的 00010111 做範例。我們現在已經知道 LS1B ( 00001000) 是在右邊數過來第四個位置。此時把 LS1B (00001000) 和 De Bruijn Sequence (00010111 ) 做相乘，等同於跟把 De Bruijn Sequence(00010111) 往左移 4 個 bit。之後再把得到的結果往右移 k^n-n 位數（範例 k=2, n=3, 2^3-3 = 5)。可得到對應的且唯一的 sub-sequence(101)。

![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/8.png)

因為唯一 sub-sequence 會對應一個唯一數字。我們可以針對這些數字建立一個 map (or lookup table)。key 為 sub-sequence number， value 為與 LS1B 之間的距離。這樣就可以直接快速定位出與 LS1B 的距離而不需要利用輪詢的方式找出。

## ERC721Psi vs ERC721 gas 比較
![image](https://github.com/BrianKuei/SoulPaintNFT/blob/master/assets/gas_fee_compare.png)

Try running test followed:

```shell
npm install
npx hardhat test
```
