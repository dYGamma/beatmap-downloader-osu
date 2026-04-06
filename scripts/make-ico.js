import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'

const buf = await pngToIco(['assets/icon-256.png'])
writeFileSync('assets/icon.ico', buf)
console.log('icon.ico created!')
