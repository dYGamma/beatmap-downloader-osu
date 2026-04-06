import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('assets/icon.svg')

// Generate 512x512 PNG
await sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('assets/icon.png')

// Generate 256x256 PNG for ICO
await sharp(svg)
  .resize(256, 256)
  .png()
  .toFile('assets/icon-256.png')

console.log('Icons generated!')
