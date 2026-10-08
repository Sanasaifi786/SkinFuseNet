/**
 * Types and interfaces for DermEnsemble - Multi-Modal Skin Lesion Diagnostic Platform
 * Based on HAM10000 dataset, SAM, CLAHE, BERT, CNN, and ViT ensemble architecture.
 */

export type LesionClassCode = 'MEL' | 'NV' | 'BCC' | 'AKIEC' | 'BKL' | 'DF' | 'VASC';

export type UIMode = 'clinical' | 'patient';

export type AppPage = 'scan' | 'models' | 'records' | 'patient' | 'ontology';

export interface Citation {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi?: string;
  pmid?: string;
  url: string;
  relevance: string;
}

export interface LesionClassInfo {
  code: LesionClassCode;
  fullName: string;
  commonName: string;
  isMalignant: boolean;
  severity: 'benign' | 'pre-malignant' | 'malignant';
  typicalAppearance: string;
  clinicalProtocol: string;
  dermatoscopicFeatures: string[];
  patientExplanation: string;
  citations: Citation[];
}

export interface PatientMetadata {
  age: number;
  sex: 'male' | 'female' | 'other';
  anatomicalSite: 'face' | 'trunk' | 'upper_extremity' | 'lower_extremity' | 'back' | 'chest' | 'scalp' | 'neck' | 'acral';
  lesionDuration: '<1 month' | '1-6 months' | '6-12 months' | '>1 year' | 'lifelong / congenital';
  hasItching: boolean;
  hasBleeding: boolean;
  hasColorChange: boolean;
  hasEnlarging: boolean;
  personalMelanomaHistory: boolean;
  familyMelanomaHistory: boolean;
  fitzpatrickSkinType: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  previousBiopsy: boolean;
}

export interface Morphometrics {
  estimatedDiameterMm: number;
  asymmetryScore: number; // 0 - 10
  borderIrregularity: number; // 0 - 10
  colorVarianceScore: number; // 0 - 10
  samBoundaryAreaPixels: number;
  samPerimeterPixels: number;
  circularity: number;
}

export interface EnsemblePrediction {
  topClass: LesionClassCode;
  topConfidence: number; // 0 - 100
  uncertaintyScore: number; // 0 - 100 (epistemic uncertainty)
  classProbabilities: Record<LesionClassCode, number>;
  modelSubScores: {
    cnn: {
      weight: number;
      topClass: LesionClassCode;
      confidence: number;
      featureHighlights: string[];
    };
    vit: {
      weight: number;
      topClass: LesionClassCode;
      confidence: number;
      featureHighlights: string[];
    };
    bert: {
      weight: number;
      topClass: LesionClassCode;
      confidence: number;
      riskFactorContribution: string[];
    };
  };
  morphometrics: Morphometrics;
  recommendedAction: 'immediate_biopsy' | 'dermatology_consult' | 'short_term_follow_up' | 'benign_routine_monitoring';
  urgencyLevel: 'critical' | 'moderate' | 'low';
}

export interface SampleCase {
  id: string;
  title: string;
  diagnosisCode: LesionClassCode;
  imageUrl: string;
  metadata: PatientMetadata;
  clinicalVignette: string;
  dermoscopicFeatures: string[];
  samPolygon: [number, number][]; // normalized [0-100, 0-100]
}

export interface SkinFuseNetBenchmark {
  version: 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';
  name: string;
  isBest?: boolean;
  isInProgress?: boolean;
  valAccuracy: number;
  valMacroF1: number;
  valLoss: number;
  trainAccuracy: number;
  trainMacroF1: number;
  trainLoss: number;
  bestEpoch: number;
  totalEpochs: number | string;
  epochLabel: string;
  changes: {
    label: string;
    value: string;
    note?: string;
    isImprovement?: boolean;
    isDecline?: boolean;
  }[];
}

export interface ModelVersionBenchmark {
  version: 'v1' | 'v2' | 'v3' | 'v4';
  tag: string;
  date: string;
  architecture: string;
  overallAccuracy: number;
  macroF1: number;
  aucRoc: number;
  sensitivityMel: number;
  specificityMel: number;
  keyInnovations: string[];
  ablationInsight: string;
  classF1Scores: Record<LesionClassCode, number>;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  doctorNotes: string;
  imageSrc: string;
  metadata: PatientMetadata;
  prediction: EnsemblePrediction;
  status: 'pending_review' | 'biopsy_scheduled' | 'monitoring' | 'discharged';
  cloudSynced: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  title: string;
  specialty: string;
  department: string;
  institution: string;
  email: string;
  avatarUrl: string;
  isCloudSynced: boolean;
  totalDiagnosed: number;
}
