/**
 * updateDummyV2.mjs
 *
 * Updates existing dummy profiles in Firestore `styleProfiles` collection
 * with V2 fields: archetypeDistribution, keywordEntries, consistencyKappa.
 *
 * Usage:
 *   node scripts/updateDummyV2.mjs
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore'

// ── Firebase config (same as seedDummyProfiles.mjs) ──
const firebaseConfig = {
  apiKey: 'AIzaSyB4dTd599QD1cdkEuBUl-pfHS35IkO5iQE',
  authDomain: 'fitting-524.firebaseapp.com',
  projectId: 'fitting-524',
  storageBucket: 'fitting-524.firebasestorage.app',
  messagingSenderId: '980615350018',
  appId: '1:980615350018:web:044dd59aec75263e60a41b',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ── Archetype Matrix M (from archetypeMatrix.ts) ──
const M = [[1.0, 0.7259, 0.6892, 0.5461, 0.6358, 0.7299, 0.4273, 0.5386, 0.3179, 0.6809, 0.4787, 0.6548, 0.5546, 0.684, 0.6792, 0.6969, 0.576, 0.8525, 0.3379, 0.7924, 0.5492, 0.1942, 0.4683, 0.3955, 0.6094, 0.7141, 0.2196, 0.5305, 0.7252, 0.8185], [0.7259, 1.0, 0.7547, 0.9344, 0.624, 0.7229, 0.7194, 0.6784, 0.3188, 0.4965, 0.594, 0.6759, 0.6781, 0.472, 0.7313, 0.7509, 0.6603, 0.8135, 0.7442, 0.9086, 0.7983, 0.4533, 0.5911, 0.7538, 0.758, 0.8212, 0.48, 0.4267, 0.4681, 0.631], [0.6892, 0.7547, 1.0, 0.596, 0.8067, 0.7781, 0.2717, 0.6438, 0.2399, 0.6535, 0.4191, 0.4465, 0.4402, 0.4867, 1.0, 0.7909, 0.5704, 0.877, 0.4357, 0.7518, 0.376, 0.5328, 0.4542, 0.36, 0.4979, 0.7244, 0.2123, 0.302, 0.528, 0.6614], [0.5461, 0.9344, 0.596, 1.0, 0.6318, 0.6062, 0.6812, 0.7154, 0.3667, 0.5139, 0.7048, 0.6406, 0.877, 0.4021, 0.7257, 0.8028, 0.6786, 0.6655, 0.9821, 0.7969, 0.4423, 0.5369, 0.6803, 0.4693, 0.7705, 0.7168, 0.5572, 0.2176, 0.6132, 0.5358], [0.6358, 0.624, 0.8067, 0.6318, 1.0, 0.6957, 0.3691, 0.7624, 0.4057, 0.6185, 0.2114, 0.4343, 0.4375, 0.4786, 0.8195, 0.811, 0.523, 0.6144, 0.3773, 0.663, 0.2781, 0.31, 0.4705, 0.1568, 0.4551, 0.5688, 0.2428, 0.3619, 0.5054, 0.4887], [0.7299, 0.7229, 0.7781, 0.6062, 0.6957, 1.0, 0.447, 0.7972, 0.321, 0.5822, 0.4962, 0.6442, 0.4903, 0.6395, 0.743, 0.8007, 0.4542, 0.6859, 0.3604, 0.8645, 0.3491, 0.4431, 0.4214, 0.2443, 0.6061, 0.8484, 0.1599, 0.5073, 0.6001, 0.7894], [0.4273, 0.7194, 0.2717, 0.6812, 0.3691, 0.447, 1.0, 0.2396, 0.5335, 0.2839, 0.6466, 0.6268, 0.6334, 0.571, 0.2448, 0.4095, 0.318, 0.3772, 0.5162, 0.7036, 0.7264, 0.5472, 0.3291, 0.6293, 0.5539, 0.5026, 0.4424, 0.2277, 0.3986, 0.4399], [0.5386, 0.6784, 0.6438, 0.7154, 0.7624, 0.7972, 0.2396, 1.0, 0.2339, 0.5884, 0.3429, 0.5154, 0.5126, 0.4089, 0.8457, 0.8939, 0.5097, 0.6126, 0.5546, 0.7623, 0.2797, 0.1993, 0.4244, 0.1914, 0.6075, 0.6764, 0.1949, 0.448, 0.5516, 0.5317], [0.3179, 0.3188, 0.2399, 0.3667, 0.4057, 0.321, 0.5335, 0.2339, 1.0, 0.1796, 0.5007, 0.3122, 0.3889, 0.6229, 0.2167, 0.2763, 0.0987, 0.2292, 0.2617, 0.4256, 0.2324, 0.3974, 0.288, 0.0837, 0.2358, 0.235, 0.169, 0.0748, 0.2177, 0.2758], [0.6809, 0.4965, 0.6535, 0.5139, 0.6185, 0.5822, 0.2839, 0.5884, 0.1796, 1.0, 0.4229, 0.6105, 0.5557, 0.5134, 0.7795, 0.6966, 0.8735, 0.953, 0.4418, 0.6997, 0.1973, 0.3642, 0.4292, 0.0941, 0.4379, 0.7939, 0.0818, 0.2976, 0.829, 0.7817], [0.4787, 0.594, 0.4191, 0.7048, 0.2114, 0.4962, 0.6466, 0.3429, 0.5007, 0.4229, 1.0, 0.7166, 0.7509, 0.6304, 0.376, 0.4832, 0.3738, 0.5033, 0.5903, 0.7206, 0.461, 0.6569, 0.5738, 0.3663, 0.6115, 0.5874, 0.353, 0.3125, 0.6645, 0.6247], [0.6548, 0.6759, 0.4465, 0.6406, 0.4343, 0.6442, 0.6268, 0.5154, 0.3122, 0.6105, 0.7166, 1.0, 0.9991, 0.8259, 0.4669, 0.6083, 0.4037, 0.5283, 0.6408, 0.7618, 0.578, 0.4616, 0.5205, 0.3734, 0.8115, 0.5934, 0.2457, 0.4963, 0.7728, 0.6839], [0.5546, 0.6781, 0.4402, 0.877, 0.4375, 0.4903, 0.6334, 0.5126, 0.3889, 0.5557, 0.7509, 0.9991, 1.0, 0.6476, 0.4783, 0.6592, 0.4799, 0.4974, 0.9452, 0.6913, 0.4734, 0.528, 0.6643, 0.3524, 0.8906, 0.5278, 0.3916, 0.2851, 0.7374, 0.502], [0.684, 0.472, 0.4867, 0.4021, 0.4786, 0.6395, 0.571, 0.4089, 0.6229, 0.5134, 0.6304, 0.8259, 0.6476, 1.0, 0.4587, 0.5556, 0.221, 0.471, 0.313, 0.7064, 0.4497, 0.4311, 0.3966, 0.2567, 0.5874, 0.4696, 0.2056, 0.491, 0.6082, 0.7324], [0.6792, 0.7313, 1.0, 0.7257, 0.8195, 0.743, 0.2448, 0.8457, 0.2167, 0.7795, 0.376, 0.4669, 0.4783, 0.4587, 1.0, 0.9686, 0.7439, 0.8642, 0.5799, 0.8136, 0.2283, 0.3859, 0.4486, 0.2852, 0.5696, 0.7536, 0.2193, 0.2907, 0.7169, 0.6393], [0.6969, 0.7509, 0.7909, 0.8028, 0.811, 0.8007, 0.4095, 0.8939, 0.2763, 0.6966, 0.4832, 0.6083, 0.6592, 0.5556, 0.9686, 1.0, 0.6158, 0.6999, 0.6495, 0.8425, 0.3073, 0.4237, 0.4278, 0.4081, 0.6617, 0.7587, 0.2401, 0.3549, 0.7131, 0.6199], [0.576, 0.6603, 0.5704, 0.6786, 0.523, 0.4542, 0.318, 0.5097, 0.0987, 0.8735, 0.3738, 0.4037, 0.4799, 0.221, 0.7439, 0.6158, 1.0, 0.9195, 0.6768, 0.6935, 0.2269, 0.3097, 0.5275, 0.3536, 0.5731, 0.8461, 0.415, 0.2614, 0.61, 0.6344], [0.8525, 0.8135, 0.877, 0.6655, 0.6144, 0.6859, 0.3772, 0.6126, 0.2292, 0.953, 0.5033, 0.5283, 0.4974, 0.471, 0.8642, 0.6999, 0.9195, 1.0, 0.5568, 0.8082, 0.5401, 0.3534, 0.4978, 0.4648, 0.6451, 0.962, 0.3715, 0.3369, 0.7087, 0.8361], [0.3379, 0.7442, 0.4357, 0.9821, 0.3773, 0.3604, 0.5162, 0.5546, 0.2617, 0.4418, 0.5903, 0.6408, 0.9452, 0.313, 0.5799, 0.6495, 0.6768, 0.5568, 1.0, 0.6576, 0.3282, 0.5045, 0.6941, 0.4242, 0.7716, 0.6384, 0.5799, 0.2064, 0.5363, 0.3511], [0.7924, 0.9086, 0.7518, 0.7969, 0.663, 0.8645, 0.7036, 0.7623, 0.4256, 0.6997, 0.7206, 0.7618, 0.6913, 0.7064, 0.8136, 0.8425, 0.6935, 0.8082, 0.6576, 1.0, 0.5879, 0.627, 0.6459, 0.7013, 0.7265, 0.8782, 0.5488, 0.6191, 0.6568, 0.8432], [0.5492, 0.7983, 0.376, 0.4423, 0.2781, 0.3491, 0.7264, 0.2797, 0.2324, 0.1973, 0.461, 0.578, 0.4734, 0.4497, 0.2283, 0.3073, 0.2269, 0.5401, 0.3282, 0.5879, 1.0, 0.313, 0.3422, 0.7709, 0.5477, 0.4, 0.481, 0.4656, 0.2457, 0.3826], [0.1942, 0.4533, 0.5328, 0.5369, 0.31, 0.4431, 0.5472, 0.1993, 0.3974, 0.3642, 0.6569, 0.4616, 0.528, 0.4311, 0.3859, 0.4237, 0.3097, 0.3534, 0.5045, 0.627, 0.313, 1.0, 0.3985, 0.2522, 0.3101, 0.3824, 0.3609, 0.206, 0.2921, 0.5136], [0.4683, 0.5911, 0.4542, 0.6803, 0.4705, 0.4214, 0.3291, 0.4244, 0.288, 0.4292, 0.5738, 0.5205, 0.6643, 0.3966, 0.4486, 0.4278, 0.5275, 0.4978, 0.6941, 0.6459, 0.3422, 0.3985, 1.0, 0.4854, 0.6239, 0.5507, 0.505, 0.4596, 0.39, 0.4689], [0.3955, 0.7538, 0.36, 0.4693, 0.1568, 0.2443, 0.6293, 0.1914, 0.0837, 0.0941, 0.3663, 0.3734, 0.3524, 0.2567, 0.2852, 0.4081, 0.3536, 0.4648, 0.4242, 0.7013, 0.7709, 0.2522, 0.4854, 1.0, 0.4767, 0.4873, 0.6543, 0.3473, 0.0419, 0.1949], [0.6094, 0.758, 0.4979, 0.7705, 0.4551, 0.6061, 0.5539, 0.6075, 0.2358, 0.4379, 0.6115, 0.8115, 0.8906, 0.5874, 0.5696, 0.6617, 0.5731, 0.6451, 0.7716, 0.7265, 0.5477, 0.3101, 0.6239, 0.4767, 1.0, 0.6366, 0.5772, 0.4557, 0.5364, 0.5985], [0.7141, 0.8212, 0.7244, 0.7168, 0.5688, 0.8484, 0.5026, 0.6764, 0.235, 0.7939, 0.5874, 0.5934, 0.5278, 0.4696, 0.7536, 0.7587, 0.8461, 0.962, 0.6384, 0.8782, 0.4, 0.3824, 0.5507, 0.4873, 0.6366, 1.0, 0.3527, 0.365, 0.6612, 0.7576], [0.2196, 0.48, 0.2123, 0.5572, 0.2428, 0.1599, 0.4424, 0.1949, 0.169, 0.0818, 0.353, 0.2457, 0.3916, 0.2056, 0.2193, 0.2401, 0.415, 0.3715, 0.5799, 0.5488, 0.481, 0.3609, 0.505, 0.6543, 0.5772, 0.3527, 1.0, 0.4332, 0.0, 0.2153], [0.5305, 0.4267, 0.302, 0.2176, 0.3619, 0.5073, 0.2277, 0.448, 0.0748, 0.2976, 0.3125, 0.4963, 0.2851, 0.491, 0.2907, 0.3549, 0.2614, 0.3369, 0.2064, 0.6191, 0.4656, 0.206, 0.4596, 0.3473, 0.4557, 0.365, 0.4332, 1.0, 0.3591, 0.4776], [0.7252, 0.4681, 0.528, 0.6132, 0.5054, 0.6001, 0.3986, 0.5516, 0.2177, 0.829, 0.6645, 0.7728, 0.7374, 0.6082, 0.7169, 0.7131, 0.61, 0.7087, 0.5363, 0.6568, 0.2457, 0.2921, 0.39, 0.0419, 0.5364, 0.6612, 0.0, 0.3591, 1.0, 0.6824], [0.8185, 0.631, 0.6614, 0.5358, 0.4887, 0.7894, 0.4399, 0.5317, 0.2758, 0.7817, 0.6247, 0.6839, 0.502, 0.7324, 0.6393, 0.6199, 0.6344, 0.8361, 0.3511, 0.8432, 0.3826, 0.5136, 0.4689, 0.1949, 0.5985, 0.7576, 0.2153, 0.4776, 0.6824, 1.0]]

// ── NORMALIZE_MAP (from keywordIndex.ts) ──
const NORMALIZE_MAP = {
  // genre
  '미니멀': { facet: 'genre', canonical: '미니멀' },
  '클래식': { facet: 'genre', canonical: '클래식' },
  '캐주얼': { facet: 'genre', canonical: '캐주얼' },
  '모던캐주얼': { facet: 'genre', canonical: '캐주얼' },
  '스트릿': { facet: 'genre', canonical: '스트릿' },
  '럭셔리스트릿': { facet: 'genre', canonical: '스트릿' },
  '그런지': { facet: 'genre', canonical: '스트릿' },
  '스케이트': { facet: 'genre', canonical: '스트릿' },
  '스포츠믹스': { facet: 'genre', canonical: '스포티' },
  '테크웨어': { facet: 'genre', canonical: '테크웨어' },
  '기능성': { facet: 'genre', canonical: '테크웨어' },
  '포멀': { facet: 'genre', canonical: '포멀' },
  '정장감': { facet: 'genre', canonical: '포멀' },
  '비즈캐주얼': { facet: 'genre', canonical: '비즈캐주얼' },
  '오피스룩': { facet: 'genre', canonical: '비즈캐주얼' },
  '페미닌': { facet: 'genre', canonical: '페미닌' },
  '여성스러움': { facet: 'genre', canonical: '페미닌' },
  '레트로': { facet: 'genre', canonical: '레트로' },
  '빈티지': { facet: 'genre', canonical: '레트로' },
  '올드스쿨': { facet: 'genre', canonical: '레트로' },
  '보헤미안': { facet: 'genre', canonical: '보헤미안' },
  '프레피': { facet: 'genre', canonical: '프레피' },
  '캠퍼스': { facet: 'genre', canonical: '프레피' },
  '프렌치': { facet: 'genre', canonical: '프렌치' },
  '아방가르드': { facet: 'genre', canonical: '아방가르드' },
  '실험적': { facet: 'genre', canonical: '아방가르드' },
  '워크웨어': { facet: 'genre', canonical: '워크웨어' },
  '리조트': { facet: 'genre', canonical: '리조트' },
  '서핑': { facet: 'genre', canonical: '리조트' },
  '썸머바이브': { facet: 'genre', canonical: '리조트' },
  '젠더리스': { facet: 'genre', canonical: '젠더리스' },
  '베이직': { facet: 'genre', canonical: '베이직' },
  '무난': { facet: 'genre', canonical: '베이직' },
  '데일리': { facet: 'genre', canonical: '베이직' },
  '시크': { facet: 'genre', canonical: '시크' },
  '걸크러시': { facet: 'genre', canonical: '시크' },
  // vibe
  '깔끔': { facet: 'vibe', canonical: '깔끔' },
  '심플': { facet: 'vibe', canonical: '깔끔' },
  '단정함': { facet: 'vibe', canonical: '깔끔' },
  '절제': { facet: 'vibe', canonical: '절제' },
  '절제미': { facet: 'vibe', canonical: '절제' },
  '부드러움': { facet: 'vibe', canonical: '부드러움' },
  '따뜻함': { facet: 'vibe', canonical: '따뜻함' },
  '편안함': { facet: 'vibe', canonical: '편안함' },
  '여유로움': { facet: 'vibe', canonical: '편안함' },
  '자유로움': { facet: 'vibe', canonical: '편안함' },
  '라운지': { facet: 'vibe', canonical: '편안함' },
  '내추럴': { facet: 'vibe', canonical: '내추럴' },
  '자연스러움': { facet: 'vibe', canonical: '내추럴' },
  '오가닉': { facet: 'vibe', canonical: '내추럴' },
  '차분함': { facet: 'vibe', canonical: '내추럴' },
  '활동적': { facet: 'vibe', canonical: '활동적' },
  '에너지': { facet: 'vibe', canonical: '활동적' },
  '화려함': { facet: 'vibe', canonical: '화려함' },
  '대담': { facet: 'vibe', canonical: '화려함' },
  '볼드': { facet: 'vibe', canonical: '화려함' },
  '세련됨': { facet: 'vibe', canonical: '세련됨' },
  '모던': { facet: 'vibe', canonical: '세련됨' },
  '트렌드': { facet: 'vibe', canonical: '세련됨' },
  '개성': { facet: 'vibe', canonical: '개성' },
  '에포트리스': { facet: 'vibe', canonical: '에포트리스' },
  '미래적': { facet: 'vibe', canonical: '미래적' },
  '신뢰감': { facet: 'vibe', canonical: '신뢰감' },
  '파워풀': { facet: 'vibe', canonical: '파워풀' },
  '펀': { facet: 'vibe', canonical: '펀' },
  '시티무드': { facet: 'vibe', canonical: '시티무드' },
  // fit
  '오버핏': { facet: 'fit', canonical: '오버핏' },
  '루즈핏': { facet: 'fit', canonical: '오버핏' },
  '슬림핏': { facet: 'fit', canonical: '슬림핏' },
  '레이어드': { facet: 'fit', canonical: '레이어드' },
  '실루엣': { facet: 'fit', canonical: '실루엣' },
  // item
  '니트': { facet: 'item', canonical: '니트' },
  '니트조끼': { facet: 'item', canonical: '니트' },
  '셔츠': { facet: 'item', canonical: '셔츠' },
  '슬랙스': { facet: 'item', canonical: '슬랙스' },
  '수트': { facet: 'item', canonical: '수트' },
  '원피스': { facet: 'item', canonical: '원피스' },
  '체크': { facet: 'item', canonical: '체크' },
  '스트라이프': { facet: 'item', canonical: '스트라이프' },
  '플로럴': { facet: 'item', canonical: '플로럴' },
  '레이스': { facet: 'item', canonical: '레이스' },
  '프릴': { facet: 'item', canonical: '프릴' },
  '그래픽': { facet: 'item', canonical: '그래픽' },
  '로고': { facet: 'item', canonical: '그래픽' },
  '하이탑': { facet: 'item', canonical: '하이탑' },
  '베레모': { facet: 'item', canonical: '베레모' },
  '패턴': { facet: 'item', canonical: '패턴' },
  '패턴믹스': { facet: 'item', canonical: '패턴' },
  '믹스매치': { facet: 'item', canonical: '믹스매치' },
  '브랜드믹스': { facet: 'item', canonical: '믹스매치' },
  '악세서리': { facet: 'item', canonical: '액세서리' },
  '액세서리': { facet: 'item', canonical: '액세서리' },
  '질감': { facet: 'item', canonical: '질감' },
  '숏컷': { facet: 'item', canonical: '숏컷' },
  // color
  '무채색': { facet: 'color', canonical: '무채색' },
  '모노톤': { facet: 'color', canonical: '무채색' },
  '블랙&화이트': { facet: 'color', canonical: '무채색' },
  '블랙': { facet: 'color', canonical: '무채색' },
  '올블랙': { facet: 'color', canonical: '무채색' },
  '비비드': { facet: 'color', canonical: '비비드' },
  '컬러풀': { facet: 'color', canonical: '비비드' },
  '컬러': { facet: 'color', canonical: '비비드' },
  '컬러블록': { facet: 'color', canonical: '비비드' },
  '볼드컬러': { facet: 'color', canonical: '비비드' },
  '어스톤': { facet: 'color', canonical: '어스톤' },
  '블루그레이': { facet: 'color', canonical: '쿨톤' },
  '차가운톤': { facet: 'color', canonical: '쿨톤' },
  '핑크': { facet: 'color', canonical: '핑크' },
  '뉴트럴': { facet: 'color', canonical: '뉴트럴' },
}

/**
 * Given an archetypeId (1-30), find the top-2 most similar other archetypes
 * from the M matrix (excluding self).
 */
function getTop2Related(archetypeId) {
  const idx = archetypeId - 1
  const row = M[idx]
  // Build array of {id, sim} excluding self
  const candidates = row
    .map((sim, j) => ({ archetypeId: j + 1, sim }))
    .filter((c) => c.archetypeId !== archetypeId)
    .sort((a, b) => b.sim - a.sim)
  return [candidates[0], candidates[1]]
}

/**
 * Build keywordEntries from a keywords array.
 * Each keyword gets its facet from NORMALIZE_MAP, weight starts at 1.0 and decreases by 0.08.
 */
function buildKeywordEntries(keywords) {
  const entries = []
  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i]
    const entry = NORMALIZE_MAP[kw]
    const facet = entry ? entry.facet : 'vibe' // fallback
    const weight = Math.max(0.1, parseFloat((1.0 - i * 0.08).toFixed(2)))
    entries.push({ keyword: kw, facet, weight })
  }
  return entries
}

// ── Main ──

async function main() {
  console.log('Fetching all dummy_ documents from styleProfiles...\n')

  const colRef = collection(db, 'styleProfiles')
  const snapshot = await getDocs(colRef)

  const dummyDocs = []
  snapshot.forEach((docSnap) => {
    if (docSnap.id.startsWith('dummy_')) {
      dummyDocs.push({ id: docSnap.id, data: docSnap.data() })
    }
  })

  console.log(`Found ${dummyDocs.length} dummy profiles to update.\n`)

  let success = 0
  let failed = 0

  for (const { id, data } of dummyDocs) {
    try {
      const archetypeId = data.archetypeId
      const keywords = data.keywords || []

      // 1) archetypeDistribution: primary=0.70, top2 related=0.18, 0.12
      const top2 = getTop2Related(archetypeId)
      const archetypeDistribution = [
        { archetypeId: archetypeId, weight: 0.70 },
        { archetypeId: top2[0].archetypeId, weight: 0.18 },
        { archetypeId: top2[1].archetypeId, weight: 0.12 },
      ]

      // 2) keywordEntries
      const keywordEntries = buildKeywordEntries(keywords)

      // 3) consistencyKappa
      const consistencyKappa = 0.85

      // Update document with merge
      await updateDoc(doc(db, 'styleProfiles', id), {
        archetypeDistribution,
        keywordEntries,
        consistencyKappa,
      })

      console.log(
        `  [OK] ${id} | primary=${archetypeId}, related=[${top2[0].archetypeId}(${top2[0].sim.toFixed(3)}), ${top2[1].archetypeId}(${top2[1].sim.toFixed(3)})] | ${keywordEntries.length} keywords`
      )
      success++
    } catch (err) {
      console.error(`  [FAIL] ${id}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
