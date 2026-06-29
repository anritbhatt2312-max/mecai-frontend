import { GearParams } from './types'

export function computeGearGeometry(params: GearParams): GearParams {
  const { teeth, module, helixAngle, faceWidth } = params
  const psiRad = (helixAngle * Math.PI) / 180
  const pitchDiameter = (module * teeth) / Math.cos(psiRad)
  const addendumDiameter = pitchDiameter + 2 * module
  const dedendumDiameter = pitchDiameter - 2.5 * module
  const torque = 120
  const Ft = (2 * torque * 1000) / pitchDiameter
  const Yf = 0.38
  const bendingStress = (Ft / (faceWidth * module * Yf)) * 1.0 * 1.12
  const fos = 310 / bendingStress

  return {
    ...params,
    pitchDiameter: +pitchDiameter.toFixed(2),
    addendumDiameter: +addendumDiameter.toFixed(2),
    dedendumDiameter: +dedendumDiameter.toFixed(2),
    bendingStress: +bendingStress.toFixed(1),
    fos: +fos.toFixed(2),
  }
}

export function buildGearToothPath(
  cx: number, cy: number, teeth: number,
  rOuter: number, rInner: number, rRoot: number
): string {
  const angleStep = (2 * Math.PI) / teeth
  let d = ''
  const pt = (r: number, a: number): [number, number] => [
    cx + r * Math.cos(a),
    cy + r * Math.sin(a),
  ]
  for (let i = 0; i < teeth; i++) {
    const a0 = i * angleStep - angleStep * 0.18
    const a1 = i * angleStep + angleStep * 0.18
    const a2 = i * angleStep + angleStep * 0.5 - angleStep * 0.18
    const a3 = i * angleStep + angleStep * 0.5 + angleStep * 0.18
    const p0 = pt(rRoot, a0 - angleStep * 0.15)
    const p1 = pt(rInner, a0)
    const p2 = pt(rOuter, a1)
    const p3 = pt(rOuter, a2)
    const p4 = pt(rInner, a3)
    const p5 = pt(rRoot, a3 + angleStep * 0.15)
    d += `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} L${p1[0].toFixed(1)},${p1[1].toFixed(1)} L${p2[0].toFixed(1)},${p2[1].toFixed(1)} L${p3[0].toFixed(1)},${p3[1].toFixed(1)} L${p4[0].toFixed(1)},${p4[1].toFixed(1)} L${p5[0].toFixed(1)},${p5[1].toFixed(1)} `
  }
  return d
}