import { ParsedJobPage } from '../services/parser.service'
import { Signal } from '../types/Signal'
import { domainAgeSignal } from './domainAge.signal'
import { emailValiditySignal } from './emailValidity.signal'
import { contentQualitySignal } from './contentQuality.signal'
import { repostFrequencySignal } from './repostFrequency.signal'

export type SignalFn = (data: ParsedJobPage) => Signal

export const allSignals: SignalFn[] = [
  domainAgeSignal,
  emailValiditySignal,
  contentQualitySignal,
  repostFrequencySignal,
]