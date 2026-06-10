// Google Drive 더미 이미지 매핑
// 폴더 번호 = 아키타입 ID (1~30)
// URL 패턴: https://drive.google.com/thumbnail?id={FILE_ID}&sz=w800

const DRIVE_FILE_IDS: Record<string, string[]> = {
  '1':  ['14nDuArc35SMzBvfl63ob-4DVRtvOtT2H', '1QI-btDwPU6NCltCpDa0YXw7BHTXpd42w', '1k3nfG5FRnwIaF0OJZyYmt5Gfvg2lOnNc', '1x89eiJXmrk-x2R9mB__jp4DDjdUqtC-K'],
  '2':  ['1fzkeTAY1XIjP61OM2X_w1vYCJKtTED0G', '1C8kmv37z1XZXSCM9zrgrLL111-pQIihl', '1_wKfT2S45oJEPWxAHhN77AeeA673Svpy', '19OkBy7uODDo5ICkd34NOGeQw6RCRoz_w'],
  '3':  ['1Z47Q-lcJ_QB2gIjysbs5YY41lvzOJ5Dy', '1zOLGyPlUYiZQt_jrPzSeAFS8qD1juNH-', '14tgKjWZShIu3k5YcCBnlUF8wo9819I0L', '1xt-goBh_9JG2m3okZ8QA-yn-z4KO4meN'],
  '4':  ['1usR832-MMx2kcwF6Xy6EL-w0umCaD06h', '1DEMVTK2z00seIfCMSvuP5VCwnWlpNrpH'],
  '5':  ['1ac-64jGh7lsppRBSP7px3QxUN6hqybez', '1n2YweCbzQvn2fDABNJguQeJRaEQ0NbjD'],
  '6':  ['1E3Eg1n-PF52jeYz7ok5UkhhdJbjm4XJ_', '12JxpXADbCQ9a36vH5clAdvd8cwZ9xU6M'],
  '7':  ['1gGWTyMoJEqdaEvyOswjmy9jFD1jeW9ve', '1eKLX-5V-wLr05JBrJWVmcVdEjh4gZIIs'],
  '8':  ['1-uWPnSSODSKGFI0mh1LdiZUWUMyljvAi', '1dgdSlB9rX7j4XceFROC2ISnaOsLFw3Yg'],
  '9':  ['1zq7gDd-PaZAr7bZmUqsHkWVsrf9xLItY', '1stl3zTIM7A3csQfpz_4T9COaLGSQaC5H'],
  '10': ['1deeZUW9wEfOFEmYu0q2XVZ8BHgQi4eg-', '1YHfjCJKRoSQgKwrX0TxsPVxv29vZGQ-v'],
  '11': ['10deAN-deGj2GWspcIkkjo_XvMWAu2pcL', '1fztVfLqo-F0o-QLTdXpEV70-cNrWhTJI'],
  '12': ['1Zp7SHyXGRiABtndBNHKn-NpTmYlBoFs7', '13y3Z2LbDtcHQcdMKrwHeNaWjwHWpiXCZ'],
  '13': ['1VKmA19Ghu4_Nlkk84Q2YXWH6HaViYMgb', '1_XmGnfvvh6NHN9zJ8o92Fcs3_tX11zHJ'],
  '14': ['179_XE9oHv9Jg4yaquAU7NeTftE7as-XH', '1879G2D9RTR1pkKEMfpJj3Zd3GcEkpMaH'],
  '15': ['1sY7MVxeIk3oARdZfunXNA9PTeA-TIf2l', '11_5hr7JxTYU3UjS7gjOfnnbTrmEp_D-j'],
  '16': ['1s8m2oTNcSo1lhqE3WrE4LcPDdjtMeh_6', '1_3E6rAtxHCT4UTyFAjY9IpUqqxPss1Oe'],
  '17': ['1Y2hXWhqxtV9UBkwHqvmFba5p90GB4Puv', '15WJjbW31VWZm9pRss_QaSwcu30C9nB7u'],
  '18': ['1hNbck0Hzo2DZ2iJ7gsEbMInqaHpesZZb', '1pz3tdNBMkMccakG1osF0QaCprDItO0PI'],
  '19': ['1L1dwhnJ_IBrsnc90XV79gKrGVw6ICmkW', '16uWS6uULQSYQYVgga2JK4fB4CkLavI9Q'],
  '20': ['1SWnMLSlLMNFxczfh2ZIOJwz3kjsMyG5d', '1AodTw6Pyr9KLWpJHBpdxsjFmnDkJ0Df8'],
  '21': ['1WaKS81JPiM6z60k9k_kzac1J9yo7o2wn', '1sxWJIlTwGDk8veyEJyN6l7ERZu2teZCx'],
  '22': ['1DQjUP_V5rqwS4bc-TuFfVPyeUn3v_Yrc', '13gW72zMFFU2vOD2WJ8GxaumpBzmCOmLD'],
  '23': ['1dRvFHkMUWhpWLZhjVMKlVaoHs8VwYR0w', '1aHbU2izuhVtl7W2O2jte18H_iMAIdGY1'],
  '24': ['18hupd-k6GY_AwhbBP3YcHIBVs5uhhrif', '1z3tL7_aLxhoecB5aRn7hg6NXLKUZEhR3'],
  '25': ['1a2EtGi-uIOYL7kdNn5AanDNZ7Niq_Z6L', '1Vk9Xo0qx0pUurT3e34sHKpyLVxo7cj3p'],
  '26': ['1_CSRHeZv2rrV7xHUi9RhUG2Vz_mPRGE9', '1qjaSCYNJNW7yb6eg56tn3M4nS1JqKW_K'],
  '27': ['1amdlpsSrgY-XwhkC0yqmv4TqGtKxt5UA', '1QdKJsfTv9fTKsVLB_xPzjZQZe9rJKouI'],
  '28': ['18zeZ6C4FzYp6j6syulH07jB-Uh5ye_ez', '1AWVmbIfIibKtoJSEnumHb3-st5b1_-3q'],
  '29': ['1h4jyrxW-GquDkchgPqbXFK2KkVjc2HmX', '1vBgrSQcmzS1BaNPrlNdFsGb9LCoWFBcn'],
  '30': ['1sG9iU16cZh6HcNiRj7J9Ju52XOuUPXQ7', '1eBNuaNnbY3R22Azu6jX6aPDzwzEMDoAg'],
}

function driveUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
}

/** 아키타입 ID(1~30)에 해당하는 더미 OOTD 이미지 URL 배열 반환 */
export function getArchetypeImageUrls(archetypeId: string): string[] {
  const ids = DRIVE_FILE_IDS[archetypeId]
  if (!ids) return []
  return ids.map(driveUrl)
}

/** 아키타입 ID에서 랜덤 이미지 1장 URL 반환 */
export function getRandomArchetypeImage(archetypeId: string): string {
  const ids = DRIVE_FILE_IDS[archetypeId]
  if (!ids || ids.length === 0) return ''
  const idx = Math.floor(Math.random() * ids.length)
  return driveUrl(ids[idx])
}
