interface PatientPromptuary {
  patientId: string;
  comorbidities: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  pastSurgeries: string[];
  familyHistory: string[];
  socialHistory: string[];
}

export const getPatientPromptuary = async (patientId: string): Promise<PatientPromptuary> => {
  return {
    patientId,
    comorbidities: [' Hipertensão', 'Diabetes Tipo 2'],
    conditions: ['Obesidade', 'Ansiedade'],
    medications: ['Losartana 50mg', 'Metformina 850mg', 'Sertralina 50mg'],
    allergies: [],
    pastSurgeries: ['Apendicectomia em 2015'],
    familyHistory: ['Pai com histórico de infarto', 'Mãe com diabetes'],
    socialHistory: ['Ex-fumante, parou há 5 anos', 'Consumo moderado de álcool'],
  };
};
