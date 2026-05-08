// Server-only utilities for Due Diligence module
import { createHash } from 'crypto'

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function maskCpf(cpf: string): string {
  const d = onlyDigits(cpf)
  if (d.length !== 11) return '***'
  return `***.***.***-${d.slice(-2)}`
}

export function maskCnpj(cnpj: string): string {
  const d = onlyDigits(cnpj)
  if (d.length !== 14) return '***'
  return `**.***.***/${d.slice(8, 12)}-${d.slice(-2)}`
}

export function validaCpf(cpf: string): boolean {
  const v = onlyDigits(cpf)
  if (v.length !== 11) return false
  if (/^(\d)\1{10}$/.test(v)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(v[i], 10) * (10 - i)
  let d1 = (s * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(v[9], 10)) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(v[i], 10) * (11 - i)
  let d2 = (s * 10) % 11
  if (d2 === 10) d2 = 0
  return d2 === parseInt(v[10], 10)
}

export function validaCnpj(cnpj: string): boolean {
  const v = onlyDigits(cnpj)
  if (v.length !== 14) return false
  if (/^(\d)\1{13}$/.test(v)) return false
  const calc = (base: string, weights: number[]) => {
    const s = base.split('').reduce((acc, n, i) => acc + parseInt(n, 10) * weights[i], 0)
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calc(v.slice(0, 12), w1)
  const d2 = calc(v.slice(0, 12) + d1, w2)
  return d1 === parseInt(v[12], 10) && d2 === parseInt(v[13], 10)
}

// Simple in-memory rate limit per user (best-effort; resets on Worker restart)
const rateMap = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60 * 60 * 1000
const MAX_REQ = 30

export function checkRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateMap.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_REQ - 1 }
  }
  if (entry.count >= MAX_REQ) return { ok: false, remaining: 0 }
  entry.count++
  return { ok: true, remaining: MAX_REQ - entry.count }
}
