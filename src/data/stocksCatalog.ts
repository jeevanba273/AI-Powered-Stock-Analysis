
export interface StockInfo {
  id: string;
  name: string;
  "bse-code": string;
  "nse-code": string;
}

// This is a sample list. You can replace this with your full list of stocks.
export const stocksCatalog: StockInfo[] = [
  {
    "bse-code": "541400",
    "name": "Zim Laboratories",
    "id": "S0000719",
    "nse-code": "ZIMLAB"
  },
  {
    "bse-code": "512455",
    "name": "Lloyds Metals And Energy",
    "id": "S0000356",
    "nse-code": "LLOYDSME"
  },
  {
    "bse-code": "500009",
    "name": "Ambalal Sarabhai Enterprises",
    "id": "S0000205",
    "nse-code": ""
  },
  {
    "bse-code": "533095",
    "name": "Bengal And Assam Company",
    "id": "S0000137",
    "nse-code": ""
  },
  {
    "bse-code": "524470",
    "name": "Syncom Formulations (India)",
    "id": "S0000038",
    "nse-code": "SYNCOMF"
  },
  {
    "bse-code": "500012",
    "name": "Andhra Petrochemicals",
    "id": "S0000056",
    "nse-code": ""
  },
  {
    "bse-code": "530131",
    "name": "Udaipur Cement Works",
    "id": "S0000037",
    "nse-code": "UDAICEMENT"
  }
];
