import { brand } from '../content/brand.ts'

type Props = {
  variant?: 'horizontal' | 'mark'
  onLight?: boolean
  className?: string
  /** Pass true when the logo is purely decorative (e.g. hero art) */
  decorative?: boolean
}

/** The only place logo artwork is rendered. Swap files via content/brand.ts. */
export default function Logo({ variant = 'horizontal', onLight = false, className, decorative = false }: Props) {
  const { logo } = brand
  const src =
    variant === 'mark'
      ? onLight ? logo.markLight : logo.markDark
      : onLight ? logo.horizontalLight : logo.horizontalDark
  const size = variant === 'mark' ? logo.markSize : logo.horizontalSize

  return (
    <img
      className={className}
      src={src}
      alt={decorative ? '' : brand.name}
      width={size.width}
      height={size.height}
    />
  )
}
