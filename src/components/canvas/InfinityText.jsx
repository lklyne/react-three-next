const InfinityText = () => {
  // A basic r3f cube
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial attach='material' color='hotpink' />
    </mesh>
  )
}

export default InfinityText
