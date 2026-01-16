import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 128,
  height: 128,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
        <svg
            viewBox="0 0 128 128"
            width="128"
            height="128"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: '#008080' }}
        >
            <path
            fill="currentColor"
            d="M87.31 10.37C77.29 4.52 64 8.08 64 8.08s-13.29-3.56-23.31 2.29c-10.02 5.85-13.62 17.5-13.62 17.5S24.23 48.43 32.5 58.17c8.27 9.74 23.31 11.29 23.31 11.29V68.3c0 0-16.5-1.58-26.6-12.75C19.08 44.4 20.9 20.59 36.4 10.87c15.5-9.72 37.3-1.68 37.3-1.68.01 0 1.94-9.72-9.39-.82zm-46.62 107.26c10.02 5.85 23.31 2.29 23.31 2.29s13.29 3.56 23.31-2.29c10.02-5.85 13.62-17.5 13.62-17.5s2.84-20.56-5.43-30.3c-8.27-9.74-23.31-11.29-23.31-11.29v1.16c0 .01 16.5 1.57 26.6 12.75c10.12 11.16 8.3 34.97-7.2 44.69c-15.5 9.72-37.3 1.68-37.3 1.68s-1.94 9.72 9.39.81z"
            />
        </svg>
    ),
    {
      ...size,
    }
  )
}
