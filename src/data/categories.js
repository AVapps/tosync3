export const CATEGORIES = {
  ABSJ: 'autre', // Absence excusée payée
  NPL: 'npl', // Non planifiable

  ABSNJ: 'absence', // Absence PN non excusée non payée

  BLANC: 'blanc',
  BLANCVOL: 'blanc', // Blanc suite à un swap vol contre blanc

  OFF: 'repos',
  OFFC: 'repos', // Jour OFF couple
  OFFD: 'repos', // JOUR OFF DESIDERATA
  OFFE: 'repos',
  OFFG: 'repos', // JOUR OFF garanti par la compagnie
  OFFH: 'repos', // OFF HS maladie
  OFFR: 'repos',
  RPC: 'repos',

  JISA: 'jisap',
  JISAP: 'jisap',

  CP: 'conges',
  CEX: 'conges', // Congés exceptionnels familiaux
  CA: 'conges',
  CAP: 'conges',
  CAHC: 'conges',
  CPI: 'conges',
  CPD: 'conges',
  CPBLANC: 'conges', // CP sur jour blanc
  CPBL: 'conges', // CP sur jour blanc

  CAPA: 'sanssolde',
  CPE: 'sanssolde', // Congé parental d'éducation
  FATIG: 'sanssolde', // Clause fatigue PN

  BURC: 'sol', // Bureau  PNC
  BURT: 'sol', // Bureau  PNT
  ENTP: 'sol',
  MEET: 'sol', // Réunion compagnie
  MINT: 'sol', // Réunion Inst
  MTE: 'sol', // Montée terrain
  WORK: 'sol', // Réunion
  VMT: 'sol',
  VM: 'sol',

  E_LE: 'sol', // 'E_LE' e-learning
  ELEAR: 'sol', // e-learning
  E_LEARN: 'sol', // e-learning
  ELEARMD: 'sol', // e-learning MD
  MD_E: 'sol', // Cours marchandises dangereuses E-learning MD_E_LEARN
  MD_E_LEARN: 'sol', // Cours marchandises dangereuses E-learning MD_E_LEARN
  ELEARNSURT: 'sol', // e-learning Sûreté
  SUR_ELEARN: 'sol', // e-learning Sûreté
  ELEARSE: 'sol', // e-learning Secourisme
  APRS: 'sol', // Cours APRS

  MD: 'sol', // Cours marchandises dangereuses [ MD_C, MD_T ]
  MDC: 'sol', // Cours MDC [ MDC_C, MDC_T ]
  SGS: 'sol', // Cours SGS [ SGS_C, SGS_T ]
  SUR: 'sol', // Cours sûreté [ SUR_C, SUR_T ]
  CRM: 'sol', // Cours CRM [ CRM_C, CRM_T ]
  SS1: 'sol', // Cours sécurité sauvetage [ SS1_C, SS1_T ]
  SS2: 'sol', // Cours sécurité sauvetage [ SS2_C, SS2_T ]
  SS3: 'sol', // Cours sécurité sauvetage [ SS3_C, SS3_T ]
  MD_C: 'sol', // Cours marchandises dangereuses pour PNC
  MD_T: 'sol', // Cours marchandises dangereuses pour PNT
  EFB: 'sol',
  CS: 'sol', // Ajout pour détection CS (cours au sol)
  CS_ATPL: 'sol', // Cours au sol pour formation ATPL
  PRAT_SS: 'sol', // Pratique porte et toboggan - secourisme - équipements
  ATQP: 'sol', // ATQP
  ATQP_AV: 'sol', // ATQP Avion
  ATQP_SS: 'sol', // Sécurité sauvetage
  MDC_COM: 'sol', // MDC PNC module commercial

  SIMU: 'simu',
  SIM: 'simu',
  LVO: 'simu',
  ENT: 'simu',
  E1: 'simu',
  E1_R: 'simu',
  E2: 'simu',
  E2_R: 'simu',
  C1: 'simu',
  C1_R: 'simu',
  C2: 'simu',
  C2_R: 'simu',
  LOE: 'simu',
  FT: 'simu',
  FT1: 'simu',
  FT2: 'simu',
  CHL: 'simu',
  UPRT: 'simu', // Simu UPRT
  SIMU_ATPL: 'simu', // simu épreuve pratique ATPL
  SIMU_CPT: 'simu', // simu stage CPT
  SIMU_R1: 'simu', // simu reprise
  SIMU_R2: 'simu', // simu reprise
  S_PRE_CPT: 'simu', // simu Pre CPT
  S_SEL_CPT: 'simu', // simu sélection CPT

  CSS: 'stage', // Cours sol SADE
  QT: 'stage',
  SIMU_QT: 'stage', // Simu de QT
  STAG: 'stage',
  STAGE_CPT: 'stage', // Cours sol stage CPT

  JDD: 'syndicat',
  JDDC: 'syndicat',
  JDDO: 'syndicat',
  JDCC: 'syndicat',
  JDDA: 'syndicat', // Jour de délégation AF
  JDDAF: 'syndicat', // Jour de délégation AF
  RSYC: 'syndicat',
  NEGO: 'syndicat',
  RCSE: 'syndicat',

  FLT: 'vol',

  DHD: 'mep',
  ENGS: 'mep',
  ENGST: 'mep',

  HS: 'maladie',
  OFFHS: 'maladie', // Arrêt maladie sur OFF

  GREV: 'greve'
}