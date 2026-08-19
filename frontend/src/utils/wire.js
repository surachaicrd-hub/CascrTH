/**
 * Wire Sample Utility, Default Master Data & Presets for Kodera / Casting Industrial Machines
 */

export const svgTemplateOptions = [
  { value: 'single_black', name: 'สายเดี่ยว สีดำ (ปอก 2 ด้าน)' },
  { value: 'single_semi_strip', name: 'สายเดี่ยว กึ่งปอกคงปลอก 2 ด้าน (Semi-Strip)' },
  { value: 'single_blue', name: 'สายเดี่ยว สีน้ำเงิน (ปอก 2 ด้าน)' },
  { value: 'single_red', name: 'สายเดี่ยว สีแดง (ปอก 2 ด้าน)' },
  { value: 'single_grey', name: 'สายเดี่ยว สีเทา (ปอก 2 ด้าน)' },
  { value: 'single_yellow', name: 'สายเดี่ยว สีเหลือง (ปอก 2 ด้าน)' },
  { value: 'single_green', name: 'สายเดี่ยว สีเขียว (ปอก 2 ด้าน)' },
  { value: 'single_white', name: 'สายเดี่ยว สีขาว (ปอก 2 ด้าน)' },
  { value: 'ground_yellow_green', name: 'สายดิน เขียว-เหลือง (ปอก 2 ด้าน)' },
  { value: 'mid_strip_multi', name: 'ปอกกลางสายหลายตำแหน่ง (Multi-Window)' },
  { value: 'twocore_sheath_strip', name: 'สายคู่ 2 คอร์ ปอกเปลือกนอก + สายใน' },
  { value: 'twocore_split_y', name: 'สายแยก 2 แฉก (Y-Branch Split Wire)' },
  { value: 'twisted_pair', name: 'สายไฟคู่ตีเกลียว (Twisted Pair)' },
  { value: 'flat_ribbon_split', name: 'สายแพแบน แยกเส้นหลายสาย (Fanned Out / Slit)' },
  { value: 'flat_ribbon_semi_strip', name: 'สายแพแบน กึ่งปอกคงปลอก 2 ด้าน (Semi-Strip)' },
  { value: 'flat_ribbon_grey', name: 'สายแพแบน สีเทา (ปอกปลาย 2 ด้าน)' },
  { value: 'flat_ribbon_rainbow', name: 'สายแพแบน สีรุ้ง (ปอกปลาย 2 ด้าน)' },
  { value: 'corrugated_tube', name: 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)' },
  { value: 'thick_cable_50sq', name: 'สายไฟขนาดใหญ่ 50 SQ' },
  { value: 'thick_cable_80sq', name: 'สายไฟขนาดใหญ่ 80 SQ' },
  { value: 'thick_cable_200sq', name: 'สายไฟขนาดใหญ่พิเศษ 200 SQ' },
  { value: 'multicore_cable', name: 'สายมัลติคอร์ (MULTI CORE)' },
  { value: 'coaxial', name: 'สายสัญญาณโคแอกเชียล (Coaxial)' },
  { value: 'crimp_double_seal', name: 'ย้ำหัว 2 ด้าน + ใส่ซีลยาง 2 ด้าน (C558SSA)' },
  { value: 'crimp_double', name: 'ย้ำหัวเทอร์มินอล 2 ด้าน (C511e / C551HXG)' },
  { value: 'crimp_double_single_seal', name: 'ย้ำหัว 2 ด้าน + ใส่ซีลยาง 1 ด้าน (C515e)' },
  { value: 'crimp_single_tin_single', name: 'ย้ำหัว 1 ด้าน + จุ่มตะกั่ว 1 ด้าน (C550SZe)' },
  { value: 'crimp_single_seal_twist_tin', name: 'ย้ำ 1 ด้าน ซีลยาง + ปั่นเกลียวจุ่มตะกั่ว (C556SZe)' },
  { value: 'tin_solder_both', name: 'ปั่นเกลียวจุ่มตะกั่ว 2 ด้าน (Solder Dipping)' },
  { value: 'custom_image', name: 'อัปโหลดรูปภาพกำหนดเอง' }
]

export const defaultWireTypeGroups = [
  {
    group: 'สายเดี่ยวปอกปลาย 2 ด้าน (Single Wire Stripping)',
    options: [
      { value: 'single_black', label: 'สายเดี่ยว สีดำ (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีดำ ปอก 2 ด้าน', template: 'single_black' },
      { value: 'single_semi_strip', label: 'สายเดี่ยว กึ่งปอกคงปลอก 2 ด้าน (Semi-Strip)', defaultTitle: 'สายเดี่ยว กึ่งปอกคงปลอก 2 ด้าน', template: 'single_semi_strip' },
      { value: 'single_blue', label: 'สายเดี่ยว สีน้ำเงิน (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีน้ำเงิน ปอก 2 ด้าน', template: 'single_blue' },
      { value: 'single_red', label: 'สายเดี่ยว สีแดง (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีแดง ปอก 2 ด้าน', template: 'single_red' },
      { value: 'single_grey', label: 'สายเดี่ยว สีเทา (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีเทา ปอก 2 ด้าน', template: 'single_grey' },
      { value: 'single_yellow', label: 'สายเดี่ยว สีเหลือง (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีเหลือง ปอก 2 ด้าน', template: 'single_yellow' },
      { value: 'single_green', label: 'สายเดี่ยว สีเขียว (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีเขียว ปอก 2 ด้าน', template: 'single_green' },
      { value: 'single_white', label: 'สายเดี่ยว สีขาว (ปอก 2 ด้าน)', defaultTitle: 'สายเดี่ยวสีขาว ปอก 2 ด้าน', template: 'single_white' },
      { value: 'ground_yellow_green', label: 'สายดิน เขียว-เหลือง (ปอก 2 ด้าน)', defaultTitle: 'สายดินเขียว-เหลือง', template: 'ground_yellow_green' }
    ]
  },
  {
    group: 'การปอกกลางสาย & สายแยก & 2-Core (Mid-Strip, Split & 2-Core)',
    options: [
      { value: 'mid_strip_multi', label: 'ปอกกลางสายหลายช่วง (Multi-Window Strip)', defaultTitle: 'ปอกกลางสายหลายตำแหน่ง', template: 'mid_strip_multi' },
      { value: 'twocore_sheath_strip', label: 'สายคู่ 2 คอร์ ปอกเปลือกนอก + ปอกสายใน', defaultTitle: 'สายคู่ 2 คอร์ ปอกเปลือกนอก', template: 'twocore_sheath_strip' },
      { value: 'twocore_split_y', label: 'สายแยก 2 แฉก (Y-Branch Split Wire)', defaultTitle: 'สายแยก 2 แฉก (Y-Branch)', template: 'twocore_split_y' },
      { value: 'twisted_pair', label: 'สายไฟคู่ตีเกลียว (Twisted Pair)', defaultTitle: 'สายไฟคู่ตีเกลียว', template: 'twisted_pair' }
    ]
  },
  {
    group: 'สายแพ & ท่อร้อยสายไฟ (Flat Ribbon & Conduit Tube)',
    options: [
      { value: 'flat_ribbon_split', label: 'สายแพแบน แยกเส้นหลายสาย (Fanned Out / Slit)', defaultTitle: 'สายแพแบนแยกเส้นหลายสาย', template: 'flat_ribbon_split' },
      { value: 'flat_ribbon_semi_strip', label: 'สายแพแบน กึ่งปอกคงปลอก 2 ด้าน (Semi-Strip)', defaultTitle: 'สายแพแบน กึ่งปอกคงปลอก 2 ด้าน', template: 'flat_ribbon_semi_strip' },
      { value: 'flat_ribbon_grey', label: 'สายแพแบน สีเทา (ปอกปลาย 2 ด้าน)', defaultTitle: 'สายแพแบนสีเทา (ปอกปลาย 2 ด้าน)', template: 'flat_ribbon_grey' },
      { value: 'flat_ribbon_rainbow', label: 'สายแพแบน สีรุ้ง (ปอกปลาย 2 ด้าน)', defaultTitle: 'สายแพแบนสีรุ้ง (ปอกปลาย 2 ด้าน)', template: 'flat_ribbon_rainbow' },
      { value: 'corrugated_tube', label: 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)', defaultTitle: 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)', template: 'corrugated_tube' }
    ]
  },
  {
    group: 'สายไฟขนาดใหญ่ & มัลติคอร์ (Heavy Duty & Multi-Core)',
    options: [
      { value: 'thick_cable_50sq', label: 'สายไฟขนาดใหญ่ 50 SQ', defaultTitle: 'สายไฟขนาดใหญ่ 50 SQ', template: 'thick_cable_50sq' },
      { value: 'thick_cable_80sq', label: 'สายไฟขนาดใหญ่ 80 SQ', defaultTitle: 'สายไฟขนาดใหญ่ 80 SQ', template: 'thick_cable_80sq' },
      { value: 'thick_cable_200sq', label: 'สายไฟขนาดใหญ่พิเศษ 200 SQ', defaultTitle: 'สายไฟขนาดใหญ่พิเศษ 200 SQ', template: 'thick_cable_200sq' },
      { value: 'multicore_cable', label: 'สายมัลติคอร์ (MULTI CORE)', defaultTitle: 'สายมัลติคอร์ MULTI CORE', template: 'multicore_cable' },
      { value: 'coaxial', label: 'สายสัญญาณโคแอกเชียล (Coaxial)', defaultTitle: 'สายสัญญาณโคแอกเชียล', template: 'coaxial' }
    ]
  },
  {
    group: 'การเข้าหัวย้ำเทอร์มินอล, ใส่ซีลยาง & บัดกรี (Crimping & Soldering)',
    options: [
      { value: 'crimp_double_seal', label: 'ย้ำหัว 2 ด้าน + ใส่ซีลยางกันน้ำ 2 ด้าน (C558SSA)', defaultTitle: 'ย้ำ 2 ด้าน + ซีลยาง 2 ด้าน', template: 'crimp_double_seal' },
      { value: 'crimp_double', label: 'ย้ำหัวเทอร์มินอล 2 ด้าน (C511e / C551HXG)', defaultTitle: 'ย้ำหัวเทอร์มินอล 2 ด้าน', template: 'crimp_double' },
      { value: 'crimp_double_single_seal', label: 'ย้ำหัว 2 ด้าน + ใส่ซีลยาง 1 ด้าน (C515e)', defaultTitle: 'ย้ำ 2 ด้าน + ซีลยาง 1 ด้าน', template: 'crimp_double_single_seal' },
      { value: 'crimp_single_tin_single', label: 'ย้ำหัว 1 ด้าน + จุ่มตะกั่ว 1 ด้าน (C550SZe)', defaultTitle: 'ย้ำ 1 ด้าน + จุ่มตะกั่ว 1 ด้าน', template: 'crimp_single_tin_single' },
      { value: 'crimp_single_seal_twist_tin', label: 'ย้ำหัว 1 ด้าน + ซีลยาง + ปั่นเกลียวจุ่มตะกั่ว (C556SZe)', defaultTitle: 'ย้ำ 1 ด้าน ซีลยาง + ปั่นเกลียวจุ่มตะกั่ว', template: 'crimp_single_seal_twist_tin' },
      { value: 'tin_solder_both', label: 'ปั่นเกลียวจุ่มตะกั่ว 2 ด้าน (Solder Dipping)', defaultTitle: 'ปั่นเกลียวจุ่มตะกั่ว 2 ด้าน', template: 'tin_solder_both' }
    ]
  },
  {
    group: 'รูปภาพกำหนดเอง (Custom Image)',
    options: [
      { value: 'custom_image', label: 'อัปโหลดรูปภาพสายไฟเอง', defaultTitle: 'สายไฟชนิดพิเศษ', template: 'custom_image' }
    ]
  }
]

export const defaultWirePresets = [
  {
    id: 'c300a',
    name: 'C300A (สายเดี่ยว ดำ/น้ำเงิน/เทา)',
    samples: [
      { type: 'single_black', title: 'สายเดี่ยวสีดำ', image: '' },
      { type: 'single_blue', title: 'สายเดี่ยวสีน้ำเงิน', image: '' },
      { type: 'single_grey', title: 'สายเดี่ยวสีเทา', image: '' }
    ]
  },
  {
    id: 'c370g',
    name: 'C370G (สายเดี่ยว ดำ/เทา/สายดิน)',
    samples: [
      { type: 'single_black', title: 'สายเดี่ยวสีดำ', image: '' },
      { type: 'single_grey', title: 'สายเดี่ยวสีเทา', image: '' },
      { type: 'ground_yellow_green', title: 'สายดินเขียว-เหลือง', image: '' }
    ]
  },
  {
    id: 'c371g',
    name: 'C371G / C381G (ปอก 2 ด้าน/ปอกกลาง/2คอร์/สายแยก)',
    samples: [
      { type: 'single_black', title: 'สายเดี่ยวสีดำ ปอก 2 ด้าน', image: '' },
      { type: 'mid_strip_multi', title: 'ปอกกลางสายหลายตำแหน่ง', image: '' },
      { type: 'twocore_sheath_strip', title: 'สายคู่ 2 คอร์ ปอกเปลือกนอก', image: '' },
      { type: 'twocore_split_y', title: 'สายแยก 2 แฉก (Y-Branch)', image: '' }
    ]
  },
  {
    id: 'c371ag',
    name: 'C371AG / C371AF (สายแพแบน/แยกเส้น/2คอร์)',
    samples: [
      { type: 'flat_ribbon_split', title: 'สายแพแบนแยกเส้นหลายสาย', image: '' },
      { type: 'flat_ribbon_grey', title: 'สายแพแบนสีเทา ปอกปลาย', image: '' },
      { type: 'twocore_sheath_strip', title: 'สายคู่ 2 คอร์ ปอกปลาย', image: '' }
    ]
  },
  {
    id: 'c372g',
    name: 'C372G (ท่อร้อยสายไฟลูกฟูก Corrugated Tube)',
    samples: [
      { type: 'corrugated_tube', title: 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)', image: '' }
    ]
  },
  {
    id: 'c373g',
    name: 'C373G (ปอกกลางสาย & สายแยก)',
    samples: [
      { type: 'single_grey', title: 'สายเดี่ยวสีเทา', image: '' },
      { type: 'mid_strip_multi', title: 'ปอกกลางสายหลายตำแหน่ง', image: '' },
      { type: 'twocore_split_y', title: 'สายแยก 2 แฉก', image: '' },
      { type: 'twocore_sheath_strip', title: 'สายคู่ 2 คอร์', image: '' }
    ]
  },
  {
    id: 'c373ag',
    name: 'C373AG (สายแพแบนขนาดใหญ่)',
    samples: [
      { type: 'flat_ribbon_split', title: 'สายแพแบนขนาดใหญ่ แยกเส้น', image: '' },
      { type: 'flat_ribbon_grey', title: 'สายแพแบนขนาดใหญ่ ปอกปลาย', image: '' }
    ]
  },
  {
    id: 'c376g',
    name: 'C376G (สายไฟขนาดใหญ่ 50 SQ)',
    samples: [
      { type: 'thick_cable_50sq', title: 'สายไฟขนาดใหญ่ 50 SQ', image: '' }
    ]
  },
  {
    id: 'c377g',
    name: 'C377A / C377G (สายไฟขนาดใหญ่ 80 SQ)',
    samples: [
      { type: 'thick_cable_80sq', title: 'สายไฟขนาดใหญ่ 80 SQ', image: '' }
    ]
  },
  {
    id: 'c378',
    name: 'C378 (สายไฟขนาดใหญ่พิเศษ 200 SQ)',
    samples: [
      { type: 'thick_cable_200sq', title: 'สายไฟขนาดใหญ่พิเศษ 200 SQ', image: '' }
    ]
  },
  {
    id: 'c385g',
    name: 'C385G (สายมัลติคอร์ MULTI CORE)',
    samples: [
      { type: 'multicore_cable', title: 'สายมัลติคอร์ MULTI CORE', image: '' }
    ]
  },
  {
    id: 'c558ssa',
    name: 'C558SSA (ย้ำ 2 ด้าน + ใส่ซีลยาง 2 ด้าน)',
    samples: [
      { type: 'crimp_double_seal', title: 'ย้ำหัว 2 ด้าน พร้อมใส่ซีลยาง 2 ด้าน', image: '' }
    ]
  },
  {
    id: 'c550sze',
    name: 'C550SZe (ย้ำ 1 ด้าน + จุ่มตะกั่ว 1 ด้าน)',
    samples: [
      { type: 'crimp_single_tin_single', title: 'ย้ำหัว 1 ด้าน + จุ่มตะกั่ว 1 ด้าน', image: '' }
    ]
  }
]

export const wireDefaultTitles = {
  single_black: 'สายเดี่ยวสีดำ ปอก 2 ด้าน',
  single_semi_strip: 'สายเดี่ยว กึ่งปอกคงปลอก 2 ด้าน',
  single_blue: 'สายเดี่ยวสีน้ำเงิน ปอก 2 ด้าน',
  single_red: 'สายเดี่ยวสีแดง ปอก 2 ด้าน',
  single_grey: 'สายเดี่ยวสีเทา ปอก 2 ด้าน',
  single_yellow: 'สายเดี่ยวสีเหลือง ปอก 2 ด้าน',
  single_green: 'สายเดี่ยวสีเขียว ปอก 2 ด้าน',
  single_white: 'สายเดี่ยวสีขาว ปอก 2 ด้าน',
  ground_yellow_green: 'สายดินเขียว-เหลือง',
  mid_strip_multi: 'ปอกกลางสายหลายตำแหน่ง',
  twocore_sheath_strip: 'สายคู่ 2 คอร์ ปอกเปลือกนอก',
  twocore_split_y: 'สายแยก 2 แฉก (Y-Branch)',
  twisted_pair: 'สายไฟคู่ตีเกลียว',
  flat_ribbon_split: 'สายแพแบนแยกเส้นหลายสาย',
  flat_ribbon_semi_strip: 'สายแพแบน กึ่งปอกคงปลอก 2 ด้าน',
  flat_ribbon_grey: 'สายแพแบนสีเทา (ปอกปลาย 2 ด้าน)',
  flat_ribbon_rainbow: 'สายแพแบนสีรุ้ง (ปอกปลาย 2 ด้าน)',
  corrugated_tube: 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)',
  thick_cable_50sq: 'สายไฟขนาดใหญ่ 50 SQ',
  thick_cable_80sq: 'สายไฟขนาดใหญ่ 80 SQ',
  thick_cable_200sq: 'สายไฟขนาดใหญ่พิเศษ 200 SQ',
  multicore_cable: 'สายมัลติคอร์ MULTI CORE',
  coaxial: 'สายสัญญาณโคแอกเชียล',
  crimp_double_seal: 'ย้ำ 2 ด้าน + ซีลยาง 2 ด้าน',
  crimp_double: 'ย้ำหัวเทอร์มินอล 2 ด้าน',
  crimp_double_single_seal: 'ย้ำ 2 ด้าน + ซีลยาง 1 ด้าน',
  crimp_single_tin_single: 'ย้ำ 1 ด้าน + จุ่มตะกั่ว 1 ด้าน',
  crimp_single_seal_twist_tin: 'ย้ำ 1 ด้าน ซีลยาง + ปั่นเกลียวจุ่มตะกั่ว',
  tin_solder_both: 'ปั่นเกลียวจุ่มตะกั่ว 2 ด้าน',
  custom_image: 'สายไฟชนิดพิเศษ'
}

export const wireTypeAliases = {
  black: 'single_black',
  single_strip_both: 'single_black',
  single_semi_strip: 'single_semi_strip',
  single_semi_strip_black: 'single_semi_strip',
  single_semi_strip_grey: 'single_semi_strip',
  semi_strip_both: 'single_semi_strip',
  semi_strip: 'single_semi_strip',
  single_slug_both: 'single_semi_strip',
  slug_both: 'single_semi_strip',
  single_semi: 'single_semi_strip',
  blue: 'single_blue',
  single_strip_blue: 'single_blue',
  red: 'single_red',
  single_strip_red: 'single_red',
  grey: 'single_grey',
  single_strip_grey: 'single_grey',
  yellow: 'single_yellow',
  single_strip_yellow: 'single_yellow',
  green: 'single_green',
  single_strip_green: 'single_green',
  white: 'single_white',
  ground: 'ground_yellow_green',
  single_ground: 'ground_yellow_green',
  single_mid_strip: 'mid_strip_multi',
  strip_mid: 'mid_strip_multi',
  twocore_cable: 'twocore_sheath_strip',
  split_wire: 'twocore_split_y',
  y_branch: 'twocore_split_y',
  twist: 'twisted_pair',
  ribbon_split: 'flat_ribbon_split',
  flat_ribbon_slit: 'flat_ribbon_split',
  ribbon_semi_strip: 'flat_ribbon_semi_strip',
  flat_ribbon_slug: 'flat_ribbon_semi_strip',
  flat_semi_strip: 'flat_ribbon_semi_strip',
  ribbon_semi: 'flat_ribbon_semi_strip',
  ribbon_grey: 'flat_ribbon_grey',
  flat_ribbon_strip: 'flat_ribbon_grey',
  ribbon_rainbow: 'flat_ribbon_rainbow',
  rainbow: 'flat_ribbon_rainbow',
  corrugated: 'corrugated_tube',
  tube: 'corrugated_tube',
  '50sq': 'thick_cable_50sq',
  c376g: 'thick_cable_50sq',
  '80sq': 'thick_cable_80sq',
  c377g: 'thick_cable_80sq',
  '200sq': 'thick_cable_200sq',
  c378: 'thick_cable_200sq',
  c385g_multicore: 'multicore_cable',
  shielded_multicore: 'multicore_cable',
  multicore: 'multicore_cable',
  coax: 'coaxial',
  c558ssa: 'crimp_double_seal',
  c511e: 'crimp_double',
  c551hxg: 'crimp_double',
  c515e: 'crimp_double_single_seal',
  c550sze: 'crimp_single_tin_single',
  c556sze: 'crimp_single_seal_twist_tin',
  solder: 'tin_solder_both'
}

/**
 * Parse wire groups from JSON or Array with fallback & auto-merging missing default options
 */
export function parseWireTypeGroups(raw) {
  const defaultGroups = JSON.parse(JSON.stringify(defaultWireTypeGroups))
  if (!raw) return defaultGroups
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(data) && data.length > 0) {
      // Find all existing option values in loaded data
      const existingValues = new Set()
      data.forEach(g => {
        (g.options || []).forEach(o => {
          if (o && o.value) existingValues.add(o.value)
        })
      })

      // Auto-merge any missing built-in default options
      defaultGroups.forEach(defGroup => {
        let targetGroup = data.find(g => g.group === defGroup.group)
        defGroup.options.forEach(defOpt => {
          if (!existingValues.has(defOpt.value)) {
            if (!targetGroup) {
              targetGroup = { group: defGroup.group, options: [] }
              data.push(targetGroup)
            }
            if (!targetGroup.options) targetGroup.options = []
            targetGroup.options.push(defOpt)
            existingValues.add(defOpt.value)
          }
        })
      })

      return data
    }
  } catch (e) {}
  return defaultGroups
}

/**
 * Parse wire presets from JSON or Array with fallback to defaultWirePresets
 */
export function parseWirePresets(raw) {
  if (!raw) return JSON.parse(JSON.stringify(defaultWirePresets))
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultWirePresets))
}

/**
 * Get display title for any wire sample (object or string) with robust fallback
 * @param {Object|String} sample 
 * @param {Array} [customGroups] Optional custom wire groups
 * @returns {String}
 */
export function getWireSampleTitle(sample, customGroups = null) {
  if (!sample) return 'ตัวอย่างสายไฟ'
  if (typeof sample === 'object' && sample.title && sample.title.trim()) {
    return sample.title.trim()
  }
  const typeKey = typeof sample === 'string' ? sample : (sample.type || sample.id || sample.name || '')
  if (!typeKey) return 'ตัวอย่างสายไฟ'
  
  // Check custom groups if provided
  if (Array.isArray(customGroups)) {
    for (const grp of customGroups) {
      const found = grp.options?.find(o => o.value === typeKey || o.id === typeKey)
      if (found?.defaultTitle) return found.defaultTitle
    }
  }

  if (wireDefaultTitles[typeKey]) return wireDefaultTitles[typeKey]
  const alias = wireTypeAliases[typeKey]
  if (alias && wireDefaultTitles[alias]) return wireDefaultTitles[alias]
  
  return 'ตัวอย่างสายไฟ'
}
