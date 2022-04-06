export const CODES_INSTRUCTION = {
  // Cours sol dispensés par un instructeur
  CS_MDC_J: { type: 'sol', tags: ['instructeur', 'mdc'], title: 'Cours au sol dispensé par un INS PN dans le cadre d’un MDC' },
  CS_CSS_J: { type: 'sol', tags: ['instructeur', 'stage', 'sade'], title: 'Cours au sol dispensé par un INS PN dans le cadre d’un SADE' },
  CS_CPT_J: { type: 'sol', tags: ['instructeur', 'stage', 'cdb'], title: 'Cours au sol dispensé par un INS PNT dans le cadre d’un stage CPT' },

  // Cours sol SADE, MDC, reprise
  CRM_T: { type: 'sol', tags: [], title: 'Cours CRM PNT' }, // SADE ou MDC
  CSS_T: { type: 'sol', tags: ['stage', 'sade'], title: 'Cours au sol SADE PNT' },
  MDC_T: { type: 'sol', tags: [], title: 'Cours au sol MDC PNT' },
  MD_T: { type: 'sol', tags: [], title: 'Cours marchandises dangereuses pour PNT' },
  SS1_T: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNT' }, // SADE ou MDC ou reprise
  SS2_T: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNT' }, // SADE ou MDC ou reprise
  SS3_T: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNT' }, // SADE ou MDC ou reprise
  SUR_T: { type: 'sol', tags: [], title: 'Cours sureté PNT' }, // SADE ou MDC

  CRM_C: { type: 'sol', tags: [], title: 'Cours CRM PNC' }, // SADE ou MDC
  CSS_C: { type: 'sol', tags: ['stage', 'sade'], title: 'Cours au sol SADE PNC' },
  MDC_C: { type: 'sol', tags: [], title: 'Cours au sol MDC PNC' },
  MD_C: { type: 'sol', tags: [], title: 'Cours marchandises dangereuses pour PNC' },
  SS1_C: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNC' }, // SADE ou MDC ou reprise
  SS2_C: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNC' }, // SADE ou MDC ou reprise
  SS3_C: { type: 'sol', tags: [], title: 'Cours sécurité sauvetage PNC' }, // SADE ou MDC ou reprise
  SUR_C: { type: 'sol', tags: [], title: 'Cours sureté PNC' }, // SADE ou MDC

  CS_ATPL: { type: 'sol', tags: ['atpl'], title: 'Cours au sol pour formation ATPL' },

  QT: { type: 'sol', tags: ['stage'], title: 'Qualification de type' },

  // Activités sol pre-CPT et stage CPT
  CS_PRE_CPT: { type: 'sol', tags: ['cdb'], title: 'Cours au sol pour formation Pré CPT' },
  CS_SEL_CPT: { type: 'sol', tags: ['cdb'], title: 'Cours au sol pour sélection CPT' },
  ENT_CPT: { type: 'sol', tags: ['cdb'], title: 'Entretien individuel pour sélection CPT' },
  STAGE_CPT: { type: 'sol', tags: ['stage', 'cdb'], title: 'Cours au sol stage CPT' },

  // simus
  C1: { type: 'simu', tags: ['controle'], title: 'C1' },
  C1_R: { type: 'simu', tags: ['controle'], title: 'C1 de reprise' },
  C2: { type: 'simu', tags: ['controle'], title: 'C2' },
  C2_R: { type: 'simu', tags: ['controle'], title: 'C2 de reprise' },
  LOE: { type: 'simu', tags: ['controle'], title: 'LOE' },
  E1: { type: 'simu', tags: [], title: "Entrainement E1 de l'année en cours" },
  E1_R: { type: 'simu', tags: [], title: 'E1 de reprise' },
  E2: { type: 'simu', tags: [], title: 'E2' },
  E2_R: { type: 'simu', tags: [], title: 'E2 de reprise' },
  SIMU_ATPL: { type: 'simu', tags: ['controle', 'atpl'], title: 'Epreuve pratique ATPL' },
  SIMU_CPT: { type: 'simu', tags: ['stage', 'cdb'], title: 'Simu stage CPT' },
  SIMU_QT: { type: 'simu', tags: ['stage', 'qt'], title: 'Simu QT' },
  SIMU_R1: { type: 'simu', tags: ['reprise'], title: 'Module de reprise' },
  SIMU_R2: { type: 'simu', tags: ['reprise'], title: "Deuxième simu de reprise avant l'entrainement" },
  S_PRE_CPT: { type: 'simu', tags: ['cdb'], title: 'Simu pour formation Pré CPT' },
  S_SEL_CPT: { type: 'simu', tags: ['cdb'], title: 'Simu pour Sélection CPT' },
  CHL_CDB: { type: 'simu', tags: ['controle'], title: 'Contrôle hors ligne' },
  CHL: { type: 'simu', tags: ['controle'], title: 'Contrôle hors ligne' },
  S_RENT_CDB: { type: 'simu', tags: [], title: 'Réentrainement CDB' },
  S_RENT_RTC: { type: 'simu', tags: [], title: 'Réentrainement RTC' },

  // Vols
  CEL: { type: 'vol', tags: ['controle'], title: 'Contrôle en ligne' },
  EXP_T_VOL: { type: 'vol', tags: ['vss'], title: 'Expérience récente' },
  PICUS: { type: 'vol', tags: [], title: "Vols PICUS pour l'OPL" },
  VFZFTT_T: { type: 'vol', tags: ['vf', 'cdb', 'stage'], title: 'Vol de familiarisation ZFTT' },
  VF_T: { type: 'vol', tags: ['vf', 'cdb', 'stage'], title: 'Vol de familiarisation' },
  VSSZ_QCDB: { type: 'vol', tags: ['vss', 'stage', 'qt'], title: "Vol sous supervision ZFTT dans le cadre de la QT d'un CDB" },
  VSSZ_QCPT: { type: 'vol', tags: ['vss', 'stage', 'qt'], title: 'Vol sous supervision ZFTT dans le cadre de la QT CPT' },
  VSSZ_QOPL: { type: 'vol', tags: ['vss', 'stage', 'qt'], title: "Vol sous supervision ZFTT dans le cadre de la QT d'un OPL" },
  VSS_ATPL: { type: 'vol', tags: ['vss', 'atpl'], title: 'Vols sous supervision ATPL' },
  VSS_CDB: { type: 'vol', tags: ['vss', 'stage', 'qt'], title: 'Vol sous supervision CDB' },
  VSS_CPT: { type: 'vol', tags: ['vss', 'stage', 'cdb'], title: 'Vol sous supervision CPT' },
  VSS_OPL: { type: 'vol', tags: ['vss', 'stage', 'qt'], title: 'Vol sous supervision OPL' },
  VSS_PRE_CPT: { type: 'vol', tags: ['vss', 'cdb'], title: 'Vol sous supervision pour Pré CPT' },
  VSS_PRECPT: { type: 'vol', tags: ['vss', 'cdb'], title: 'Vol sous supervision pour Pré CPT' },
  VSS_R_CDB: { type: 'vol', tags: ['vss', 'reprise'], title: 'Vol sous supervision CDB' },
  VSS_R_OPL: { type: 'vol', tags: ['vss', 'reprise'], title: 'Vol sous supervision OPL' },

  // pnc
  VOL_AC: { type: 'vol', tags: ['pnc'], title: '' }, // A confirmer
  VF_737_C: { type: 'vol', tags: ['vf', 'pnc'], title: 'Vol de familiarisation PNC' },
  VF_C: { type: 'vol', tags: ['vf', 'pnc'], title: 'Vol de familiarisation PNC' }
}