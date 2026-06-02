import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const LOGO = path.join(root, 'src/public/img/ambelcor-oscuro.png')
const OUT = path.join(root, 'public/icons')
const BG = '#ffffff' // fondo blanco

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
]

async function compose(size, outFile) {
  const padding = Math.round(size * 0.15)
  const logoSize = size - padding * 2

  const logo = await sharp(LOGO)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outFile)

  console.log(`✓ ${outFile}`)
}

for (const { name, size } of sizes) {
  await compose(size, path.join(OUT, name))
}

console.log('\nIconos PWA generados en public/icons/')
