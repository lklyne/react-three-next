'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useControls, Leva } from 'leva'

import InfinityText from '@/components/canvas/InfinityText'

const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const config = useControls('Text', {
    text: 'EVERYTHING & NOTHING ',
    color: '#fFFFFF',
    fontSize: { value: 0.4, min: 0.1, max: 2 },
    fontDepth: { value: 0.14, min: 0.01, max: 3.5 },
    uRadius: { value: 1.68, min: 0.1, max: 3 },
    uTwists: { value: 3, min: 0, max: 3, step: 1 },
    uTwistSpeed: { value: 100, min: -100, max: 100, step: 1 },
    uRotateSpeed: { value: 3, min: 0, max: 3, step: 0.01 },
  })

  return (
    <>
      <View orbit className='relative h-full w-full'>
        <Suspense fallback={null}>
          {/* <Dog scale={2} position={[0, -1.6, 0]} rotation={[0.0, -0.3, 0]} /> */}
          <InfinityText config={config} />
          <Common color={'lightpink'} />
        </Suspense>
      </View>
    </>
  )
}
