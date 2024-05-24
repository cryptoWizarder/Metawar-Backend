import config from "~/config";

const COLLECTIONS = [
  {
    type: 'imx',
    id: '1',
    address: '0xe2c921ed59f5a4011b4ffc6a4747015dcb5b804f',
    name: 'Kira Genesis',
    img_url:
      `${config.publicUrl}/resizer/url=aHR0cHM6Ly9hcndlYXZlLm5ldC8zOTlZeUt5UndNdUtINndCS0pNcVNGZDhGaEtKMUpjdHJsQ0h2NVplcXZvL2dlbmVzaXMucG5n&w=640`,
  },
  {
    type: 'imx',
    id: '2',
    address: '0xd92462f2dc5812d05f22b434ca3c2dfc24828550',
    name: 'Meme Man',
    img_url:
      `${config.publicUrl}/resizer/url=aHR0cDovL2Fyd2VhdmUubmV0L0JMbzA2RG1uMkh6ME9jQ1lpWTNsc1VCaXhiSGpvSHpUUWktMnhXNFNnSFEvTWVtZU1hbi5wbmc=&w=640`,
  },
  {
    type: 'opensea',
    id: '3',
    address: '0xBf7dB7c4e9C7bcef25859a7411eB98e7F7Cf228E',
    name: 'The Bridged',
    img_url:
      `${config.publicUrl}/resizer/url=aHR0cHM6Ly9pLnNlYWRuLmlvL2djcy9maWxlcy83ZmYyOGJjMzc0M2IwODYzYzFmMTFmYWJlNzcwZjg4MS5wbmc%2FYXV0bz1mb3JtYXQmZHByPTEmdz0zODQw&w=640`,
  },
];

export default COLLECTIONS;
