// Matching exact Excel structure with 96 questions and killer logic
import { siteConfig } from "./site-config"

export const MODEL_VERSION = "2.1.0";

export type QuestionType = "binary" | "frequency" | "multiple" | "coverage" | "governance"

export interface UnderwritingQuestion {
      id: string
      domain: string
      text: string
      type: QuestionType
      options?: {
            label: string
            value: number
      }[]
      response: number
      maxValue?: number
      isKiller: boolean
      defaultIsKiller?: boolean
}

export interface Domain {
      id: string
      name: string
      defaultWeight: number
      activeWeight: number
      explanation?: string
      questions: UnderwritingQuestion[]
}

export interface IndustryProfile {
      id: string
      name: string
      domainWeights: {
            [domainName: string]: number
      }
}

export interface ScoringResult {
      totalScore: number
      domainScores: Array<{
            domain: string
            score: number
            defaultWeight: number
            activeWeight: number
            contribution: number
            maxScore: number
            earnedScore: number
      }>
      riskTier: "A" | "B" | "C" | "D"
      premiumLoading: string
      autoDeclined: boolean
      failedKillers: Array<{ id: string; text: string; domain: string }>
      volatilityScore: number
      normalizedScore: number
      declineNarrative: string
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
      {
            id: "cyber_security",
            name: "Cyber Security",
            domainWeights: {
                  "Network Security": 7,
                  "Data Backup and Recovery": 7,
                  "Certifications": 4,
                  "Background Verification and Employee Awareness": 4,
                  "Regulatory Compliance": 5,
                  "Organization Policies and Procedures": 5,
                  "Physical Perimeter Security": 7,
                  "Endpoint Security": 6,
                  "IoT and OT Network": 9,
                  "Asset Management": 6,
                  "Identity and Access Management": 6,
                  "Vulnerability Assessment and Penetration Test": 5,
                  "Ransomware Supplemental": 5,
                  "Dark Web Exposure": 2,
                  "Change / Patch Cadence": 5,
                  "DLP and DSPM": 4,
                  "Active Directory Configuration": 3,
                  "Incident Management Response": 6,
                  "SOC and SOAR": 4
            }
      },
      {
            id: "manufacturing_and_engineering",
            name: "Manufacturing and Engineering",
            domainWeights: {
                  "Network Security": 7,
                  "Data Backup and Recovery": 8,
                  "Certifications": 3,
                  "Background Verification and Employee Awareness": 4,
                  "Regulatory Compliance": 5,
                  "Organization Policies and Procedures": 3,
                  "Physical Perimeter Security": 7,
                  "Endpoint Security": 6,
                  "IoT and OT Network": 10,
                  "Asset Management": 5,
                  "Identity and Access Management": 5,
                  "Vulnerability Assessment and Penetration Test": 6,
                  "Ransomware Supplemental": 7,
                  "Dark Web Exposure": 2,
                  "Change / Patch Cadence": 5,
                  "DLP and DSPM": 4,
                  "Active Directory Configuration": 4,
                  "Incident Management Response": 5,
                  "SOC and SOAR": 4
            }
      },
      {
            id: "construction_and_infrastructure",
            name: "Construction and Infrastructure",
            domainWeights: {
                  "Network Security": 6,
                  "Data Backup and Recovery": 7,
                  "Certifications": 3,
                  "Background Verification and Employee Awareness": 5,
                  "Regulatory Compliance": 6,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 9,
                  "Endpoint Security": 5,
                  "IoT and OT Network": 9,
                  "Asset Management": 6,
                  "Identity and Access Management": 5,
                  "Vulnerability Assessment and Penetration Test": 5,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 2,
                  "Change / Patch Cadence": 4,
                  "DLP and DSPM": 3,
                  "Active Directory Configuration": 4,
                  "Incident Management Response": 6,
                  "SOC and SOAR": 5
            }
      },
      {
            id: "it_and_technology_services",
            name: "IT and Technology Services",
            domainWeights: {
                  "Network Security": 8,
                  "Data Backup and Recovery": 6,
                  "Certifications": 4,
                  "Background Verification and Employee Awareness": 5,
                  "Regulatory Compliance": 6,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 2,
                  "Endpoint Security": 7,
                  "IoT and OT Network": 2,
                  "Asset Management": 5,
                  "Identity and Access Management": 9,
                  "Vulnerability Assessment and Penetration Test": 7,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 4,
                  "Change / Patch Cadence": 6,
                  "DLP and DSPM": 8,
                  "Active Directory Configuration": 6,
                  "Incident Management Response": 5,
                  "SOC and SOAR": 0
            }
      },
      {
            id: "healthcare_and_pharmaceuticals",
            name: "Healthcare and Pharmaceuticals",
            domainWeights: {
                  "Network Security": 7,
                  "Data Backup and Recovery": 9,
                  "Certifications": 4,
                  "Background Verification and Employee Awareness": 5,
                  "Regulatory Compliance": 9,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 5,
                  "Endpoint Security": 6,
                  "IoT and OT Network": 5,
                  "Asset Management": 5,
                  "Identity and Access Management": 7,
                  "Vulnerability Assessment and Penetration Test": 5,
                  "Ransomware Supplemental": 8,
                  "Dark Web Exposure": 4,
                  "Change / Patch Cadence": 4,
                  "DLP and DSPM": 7,
                  "Active Directory Configuration": 3,
                  "Incident Management Response": 2,
                  "SOC and SOAR": 1
            }
      },
      {
            id: "retail_and_e-commerce",
            name: "Retail and E-Commerce",
            domainWeights: {
                  "Network Security": 7,
                  "Data Backup and Recovery": 6,
                  "Certifications": 3,
                  "Background Verification and Employee Awareness": 4,
                  "Regulatory Compliance": 6,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 4,
                  "Endpoint Security": 6,
                  "IoT and OT Network": 3,
                  "Asset Management": 5,
                  "Identity and Access Management": 8,
                  "Vulnerability Assessment and Penetration Test": 6,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 7,
                  "Change / Patch Cadence": 6,
                  "DLP and DSPM": 7,
                  "Active Directory Configuration": 5,
                  "Incident Management Response": 5,
                  "SOC and SOAR": 2
            }
      },
      {
            id: "hospitality_and_tourism",
            name: "Hospitality and Tourism",
            domainWeights: {
                  "Network Security": 6,
                  "Data Backup and Recovery": 6,
                  "Certifications": 3,
                  "Background Verification and Employee Awareness": 6,
                  "Regulatory Compliance": 5,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 7,
                  "Endpoint Security": 8,
                  "IoT and OT Network": 4,
                  "Asset Management": 5,
                  "Identity and Access Management": 7,
                  "Vulnerability Assessment and Penetration Test": 5,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 6,
                  "Change / Patch Cadence": 5,
                  "DLP and DSPM": 6,
                  "Active Directory Configuration": 4,
                  "Incident Management Response": 4,
                  "SOC and SOAR": 3
            }
      },
      {
            id: "logistics_and_transportation",
            name: "Logistics and Transportation",
            domainWeights: {
                  "Network Security": 6,
                  "Data Backup and Recovery": 7,
                  "Certifications": 3,
                  "Background Verification and Employee Awareness": 5,
                  "Regulatory Compliance": 6,
                  "Organization Policies and Procedures": 4,
                  "Physical Perimeter Security": 7,
                  "Endpoint Security": 5,
                  "IoT and OT Network": 8,
                  "Asset Management": 7,
                  "Identity and Access Management": 5,
                  "Vulnerability Assessment and Penetration Test": 5,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 3,
                  "Change / Patch Cadence": 5,
                  "DLP and DSPM": 4,
                  "Active Directory Configuration": 4,
                  "Incident Management Response": 6,
                  "SOC and SOAR": 4
            }
      },
      {
            id: "financial_services_and_banking",
            name: "Financial Services and Banking",
            domainWeights: {
                  "Network Security": 8,
                  "Data Backup and Recovery": 6,
                  "Certifications": 4,
                  "Background Verification and Employee Awareness": 6,
                  "Regulatory Compliance": 10,
                  "Organization Policies and Procedures": 5,
                  "Physical Perimeter Security": 3,
                  "Endpoint Security": 6,
                  "IoT and OT Network": 1,
                  "Asset Management": 4,
                  "Identity and Access Management": 10,
                  "Vulnerability Assessment and Penetration Test": 7,
                  "Ransomware Supplemental": 6,
                  "Dark Web Exposure": 7,
                  "Change / Patch Cadence": 5,
                  "DLP and DSPM": 8,
                  "Active Directory Configuration": 2,
                  "Incident Management Response": 1,
                  "SOC and SOAR": 1
            }
      }
]



export type RelevancyLevel = "critical" | "standard" | "niche" | "not_required"

export interface CertRelevancy {
      id: string
      name: string
      levels: Record<string, RelevancyLevel> // industryId -> level
}

export const CERT_RELEVANCY_MAP: CertRelevancy[] = [
      {
            id: "CERT-001",
            name: "ISO/IEC 27001",
            levels: {
                  "cyber_security": "critical",
                  "it_and_technology_services": "critical",
                  "financial_services_and_banking": "critical",
                  "healthcare_and_pharmaceuticals": "standard",
                  "manufacturing_and_engineering": "standard",
                  "retail_and_e-commerce": "standard",
                  "hospitality_and_tourism": "standard",
                  "logistics_and_transportation": "standard",
                  "construction_and_infrastructure": "standard"
            }
      },
      {
            id: "CERT-002",
            name: "NIST Framework",
            levels: {
                  "cyber_security": "critical",
                  "it_and_technology_services": "critical",
                  "financial_services_and_banking": "critical",
                  "manufacturing_and_engineering": "standard",
                  "healthcare_and_pharmaceuticals": "standard",
                  "retail_and_e-commerce": "niche",
                  "logistics_and_transportation": "niche",
                  "construction_and_infrastructure": "niche",
                  "hospitality_and_tourism": "niche"
            }
      },
      {
            id: "CERT-003",
            name: "SOC 2 Type II",
            levels: {
                  "it_and_technology_services": "critical",
                  "cyber_security": "critical",
                  "financial_services_and_banking": "standard",
                  "healthcare_and_pharmaceuticals": "standard",
                  "retail_and_e-commerce": "niche",
                  "manufacturing_and_engineering": "not_required",
                  "construction_and_infrastructure": "not_required",
                  "hospitality_and_tourism": "not_required",
                  "logistics_and_transportation": "not_required"
            }
      },
      {
            id: "CERT-004",
            name: "HIPAA",
            levels: {
                  "healthcare_and_pharmaceuticals": "critical",
                  "it_and_technology_services": "niche",
                  "cyber_security": "niche",
                  "financial_services_and_banking": "not_required",
                  "manufacturing_and_engineering": "not_required",
                  "retail_and_e-commerce": "not_required",
                  "hospitality_and_tourism": "not_required",
                  "logistics_and_transportation": "not_required",
                  "construction_and_infrastructure": "not_required"
            }
      },
      {
            id: "CERT-005",
            name: "PCI DSS",
            levels: {
                  "retail_and_e-commerce": "critical",
                  "hospitality_and_tourism": "critical",
                  "financial_services_and_banking": "critical",
                  "it_and_technology_services": "standard",
                  "cyber_security": "standard",
                  "healthcare_and_pharmaceuticals": "niche",
                  "logistics_and_transportation": "niche",
                  "manufacturing_and_engineering": "not_required",
                  "construction_and_infrastructure": "not_required"
            }
      }
]

export const ALL_QUESTIONS: UnderwritingQuestion[] = [
      {
            id: "NS-001",
            domain: "Network Security",
            text: "Is Firewall implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-002",
            domain: "Network Security",
            text: "Is DDoS Protection implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-003",
            domain: "Network Security",
            text: "Is WAF (Web Application Firewall) implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-004",
            domain: "Network Security",
            text: "Is IDS/IPS implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-005",
            domain: "Network Security",
            text: "Is NGFW (Next-Gen Firewall) implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-006",
            domain: "Network Security",
            text: "Are network segmentation and VLANs used to limit access?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-007",
            domain: "Network Security",
            text: "Are VPNs used for secure remote access?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-008",
            domain: "Network Security",
            text: "Is wireless network security implemented with encryption?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-009",
            domain: "Network Security",
            text: "Is there a process to review the firewall rules?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Quarterly",
                        "value": 1.0
                  },
                  {
                        "label": "Half-yearly",
                        "value": 0.75
                  },
                  {
                        "label": "Annually",
                        "value": 0.5
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "NS-010",
            domain: "Network Security",
            text: "How often do you perform review of network architecture?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Quarterly",
                        "value": 1.0
                  },
                  {
                        "label": "Half-yearly",
                        "value": 0.75
                  },
                  {
                        "label": "Annually",
                        "value": 0.5
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-001",
            domain: "Data Backup and Recovery",
            text: "Are regular backups performed on critical systems?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-002",
            domain: "Data Backup and Recovery",
            text: "Are backups encrypted during storage and transmission?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-003",
            domain: "Data Backup and Recovery",
            text: "Are backup procedures tested regularly for recovery?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-004",
            domain: "Data Backup and Recovery",
            text: "Is there a defined Recovery Point Objective (RPO) and Recovery Time Objective (RTO)?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-005",
            domain: "Data Backup and Recovery",
            text: "Are cloud-based backups in place?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-006",
            domain: "Data Backup and Recovery",
            text: "Are backups stored in geographically separate locations?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-007",
            domain: "Data Backup and Recovery",
            text: "Is there a disaster recovery plan in place?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-008",
            domain: "Data Backup and Recovery",
            text: "Are offline backups stored off-site in place?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DBR-009",
            domain: "Data Backup and Recovery",
            text: "Is RTO for critical systems <24 hours?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "CERT-001",
            domain: "Certifications",
            text: "Is your organization certified for ISO/IEC 27001?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  },
                  {
                        "label": "N/A",
                        "value": -2
                  }
            ],
      },
      {
            id: "CERT-002",
            domain: "Certifications",
            text: "Is your organization certified for NIST?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  },
                  {
                        "label": "N/A",
                        "value": -2
                  }
            ],
      },
      {
            id: "CERT-003",
            domain: "Certifications",
            text: "Is your organization certified for SOC 2?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  },
                  {
                        "label": "N/A",
                        "value": -2
                  }
            ],
      },
      {
            id: "CERT-004",
            domain: "Certifications",
            text: "Is your organization certified for HIPAA?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  },
                  {
                        "label": "N/A",
                        "value": -2
                  }
            ],
      },
      {
            id: "CERT-005",
            domain: "Certifications",
            text: "Is your organization certified for PCI DSS?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  },
                  {
                        "label": "N/A",
                        "value": 1.0
                  }
            ],
      },
      {
            id: "BV-001",
            domain: "Background Verification and Employee Awareness",
            text: "Do you perform background verification of employees/subcontractors before onboarding?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-002",
            domain: "Background Verification and Employee Awareness",
            text: "How often are security awareness trainings conducted?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Half-yearly",
                        "value": 1.0
                  },
                  {
                        "label": "Annually",
                        "value": 0.75
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-003",
            domain: "Background Verification and Employee Awareness",
            text: "Is Password Management and MFA covered in training?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-004",
            domain: "Background Verification and Employee Awareness",
            text: "Is Social Media security covered in training?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-005",
            domain: "Background Verification and Employee Awareness",
            text: "Is Data Classification covered in training?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-006",
            domain: "Background Verification and Employee Awareness",
            text: "Is Phishing, Vishing, SMiShing covered in training?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-007",
            domain: "Background Verification and Employee Awareness",
            text: "Does applicant provide security awareness training to employees annually?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "BV-008",
            domain: "Background Verification and Employee Awareness",
            text: "Does applicant use simulated phishing attacks to test employees?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RC-001",
            domain: "Regulatory Compliance",
            text: "Do you comply with applicable regulatory guidelines?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RC-002",
            domain: "Regulatory Compliance",
            text: "Are data protection laws (GDPR, DPDP) implemented?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RC-003",
            domain: "Regulatory Compliance",
            text: "Is there a documented data retention policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RC-004",
            domain: "Regulatory Compliance",
            text: "Are regulatory audit reports current?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-001",
            domain: "Organization Policies and Procedures",
            text: "Do you have a Cyber Crisis Management Plan?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-002",
            domain: "Organization Policies and Procedures",
            text: "Do you have an Information Technology Policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-003",
            domain: "Organization Policies and Procedures",
            text: "Do you have an Information Security Policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-004",
            domain: "Organization Policies and Procedures",
            text: "Do you have an Incident Management Policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-005",
            domain: "Organization Policies and Procedures",
            text: "Do you have a Data Protection & Privacy Policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "OP-006",
            domain: "Organization Policies and Procedures",
            text: "Do you have a Business Continuity Plan (BCP)?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PPS-001",
            domain: "Physical Perimeter Security",
            text: "Are physical security measures in place to protect data centers?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PPS-002",
            domain: "Physical Perimeter Security",
            text: "Are access control systems (keycards, biometrics, CCTV) implemented for secure areas?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PPS-003",
            domain: "Physical Perimeter Security",
            text: "Is there a policy for securing physical network ports?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PPS-004",
            domain: "Physical Perimeter Security",
            text: "Are intrusion detection systems in place for physical premises?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PPS-005",
            domain: "Physical Perimeter Security",
            text: "Are periodic physical security audits conducted?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-001",
            domain: "Endpoint Security",
            text: "Are endpoint devices configured with encryption?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-002",
            domain: "Endpoint Security",
            text: "How often are patches reviewed for endpoint devices?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Quarterly",
                        "value": 1.0
                  },
                  {
                        "label": "Half-yearly",
                        "value": 0.75
                  },
                  {
                        "label": "Annually",
                        "value": 0.5
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-003",
            domain: "Endpoint Security",
            text: "Are mobile devices enrolled in a Mobile Device Management (MDM) solution?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-004",
            domain: "Endpoint Security",
            text: "Is there a process for securing and wiping lost/stolen devices?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-005",
            domain: "Endpoint Security",
            text: "Do all workstations have antivirus with heuristic capabilities?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ES-006",
            domain: "Endpoint Security",
            text: "Are endpoint security tools with behavioral detection deployed?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IOT-001",
            domain: "IoT and OT Network",
            text: "Is there an inventory of all IoT and OT devices connected to the network?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IOT-002",
            domain: "IoT and OT Network",
            text: "How often are IoT and OT network security assessments conducted?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Monthly",
                        "value": 1.0
                  },
                  {
                        "label": "Quarterly",
                        "value": 0.75
                  },
                  {
                        "label": "Annually",
                        "value": 0.5
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IOT-003",
            domain: "IoT and OT Network",
            text: "Are there network segmentation strategies to isolate IoT and OT devices?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IOT-004",
            domain: "IoT and OT Network",
            text: "Is there monitoring of IoT/OT device communications?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IOT-005",
            domain: "IoT and OT Network",
            text: "Are default credentials changed on all IoT devices?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "AM-001",
            domain: "Asset Management",
            text: "Do you maintain a comprehensive inventory of all assets?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "AM-002",
            domain: "Asset Management",
            text: "Do you maintain Asset Criticality in inventory?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "AM-003",
            domain: "Asset Management",
            text: "Do you maintain Asset Owner in inventory?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "AM-004",
            domain: "Asset Management",
            text: "Do you maintain Asset Provisioning and EOL dates?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "AM-005",
            domain: "Asset Management",
            text: "Do you follow a step-by-step approach for asset provisioning/deprovisioning?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IAM-001",
            domain: "Identity and Access Management",
            text: "Is multi-factor authentication implemented for all critical systems?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IAM-002",
            domain: "Identity and Access Management",
            text: "How often are access rights reviewed?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Monthly",
                        "value": 1.0
                  },
                  {
                        "label": "Quarterly",
                        "value": 0.9
                  },
                  {
                        "label": "Half-yearly",
                        "value": 0.75
                  },
                  {
                        "label": "Annually",
                        "value": 0.5
                  },
                  {
                        "label": "Never",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IAM-003",
            domain: "Identity and Access Management",
            text: "Are privileged access accounts monitored using PAM solution?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IAM-004",
            domain: "Identity and Access Management",
            text: "Is there an account lockout policy for failed login attempts?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IAM-005",
            domain: "Identity and Access Management",
            text: "Are access permissions revoked immediately upon employee termination?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "VA-001",
            domain: "Vulnerability Assessment and Penetration Test",
            text: "Do you have automated tools for periodic scanning of network components?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "VA-002",
            domain: "Vulnerability Assessment and Penetration Test",
            text: "How often do you perform VA-PT assessment through external auditor?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Quarterly",
                        "value": 1.0
                  },
                  {
                        "label": "Annually",
                        "value": 0.75
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "VA-003",
            domain: "Vulnerability Assessment and Penetration Test",
            text: "Are identified vulnerabilities mitigated in a defined timeframe?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "VA-004",
            domain: "Vulnerability Assessment and Penetration Test",
            text: "Is there a risk-based prioritization for vulnerability remediation?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RS-001",
            domain: "Ransomware Supplemental",
            text: "Is phishing success ratio less than 15% on last test?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RS-002",
            domain: "Ransomware Supplemental",
            text: "Does applicant tag/mark e-mails from outside the organization?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RS-003",
            domain: "Ransomware Supplemental",
            text: "Is there a process to report suspicious e-mails to security team?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RS-004",
            domain: "Ransomware Supplemental",
            text: "Is there a documented process to respond to phishing campaigns?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "RS-005",
            domain: "Ransomware Supplemental",
            text: "Does email filtering block known malicious attachments?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DW-001",
            domain: "Dark Web Exposure",
            text: "How frequently are dark web scans conducted?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Daily",
                        "value": 1.0
                  },
                  {
                        "label": "Weekly",
                        "value": 0.9
                  },
                  {
                        "label": "Monthly",
                        "value": 0.75
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DW-002",
            domain: "Dark Web Exposure",
            text: "Are dark web monitoring alerts reviewed regularly?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DW-003",
            domain: "Dark Web Exposure",
            text: "Is there a process to respond to dark web exposure?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PC-001",
            domain: "Change / Patch Cadence",
            text: "Is there a documented change/patch management policy?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PC-002",
            domain: "Change / Patch Cadence",
            text: "Is target time to deploy critical patches <24 hours?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "PC-003",
            domain: "Change / Patch Cadence",
            text: "Is year-to-date critical patch compliance >90%?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DLP-001",
            domain: "DLP and DSPM",
            text: "Is there a DLP solution implemented to monitor sensitive data?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "DLP-002",
            domain: "DLP and DSPM",
            text: "How often is DLP policy reviewed and updated?",
            type: "frequency",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Bi-annually",
                        "value": 1.0
                  },
                  {
                        "label": "Annually",
                        "value": 0.75
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ADC-001",
            domain: "Active Directory Configuration",
            text: "Is Active Directory (AD) auditing enabled?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "ADC-002",
            domain: "Active Directory Configuration",
            text: "Are service accounts managed with least privilege?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IR-001",
            domain: "Incident Management Response",
            text: "How is incident management and response process executed?",
            type: "multiple",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Both",
                        "value": 1.0
                  },
                  {
                        "label": "IR_only",
                        "value": 0.75
                  },
                  {
                        "label": "SOC_only",
                        "value": 0.5
                  },
                  {
                        "label": "Neither",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IR-002",
            domain: "Incident Management Response",
            text: "Are historical incident statistics maintained?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  {
                        "label": "Yes",
                        "value": 1.0
                  },
                  {
                        "label": "No",
                        "value": 0.0
                  }
            ],
      },
      {
            id: "IR-005",
            domain: "Incident Management Response",
            text: "Is external reporting responsibility defined?",
            type: "governance",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Formal", value: 1.0 },
                  { label: "Informal", value: 0.5 },
                  { label: "Not defined", value: 0.0 }
            ],
      },
      {
            id: "SOC-001",
            domain: "SOC and SOAR",
            text: "What is SOC monitoring capability?",
            type: "multiple",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Internal_24x7", value: 1.0 },
                  { label: "3rd_party_24x7", value: 0.75 },
                  { label: "Partial_24x7", value: 0.5 },
                  { label: "No_SOC", value: 0.0 }
            ],
      },
      {
            id: "SOC-002",
            domain: "SOC and SOAR",
            text: "Is there a mechanism for real-time alerting and escalation?",
            type: "binary",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Yes", value: 1.0 },
                  { label: "No", value: 0.0 }
            ],
      },
      {
            id: "SOC-003",
            domain: "SOC and SOAR",
            text: "Is log monitoring conducted 24×7?",
            type: "coverage",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Full", value: 1.0 },
                  { label: "Partial", value: 0.5 },
                  { label: "None", value: 0.0 }
            ],
      },
      {
            id: "SOC-004",
            domain: "SOC and SOAR",
            text: "Are OT logs integrated where feasible?",
            type: "coverage",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Full", value: 1.0 },
                  { label: "Partial", value: 0.5 },
                  { label: "None", value: 0.0 }
            ],
      },
      {
            id: "SOC-005",
            domain: "SOC and SOAR",
            text: "Are alerts triaged with defined SLAs?",
            type: "governance",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Formal", value: 1.0 },
                  { label: "Informal", value: 0.5 },
                  { label: "Not defined", value: 0.0 }
            ],
      },
      {
            id: "SOC-006",
            domain: "SOC and SOAR",
            text: "Is incident automation or playbooks used?",
            type: "coverage",
            response: -1,
            isKiller: false,
            options: [
                  { label: "Full", value: 1.0 },
                  { label: "Partial", value: 0.5 },
                  { label: "None", value: 0.0 }
            ],
      },
]

export const DOMAINS: Domain[] = [
      {
            id: "organizational_policies_and_procedures",
            name: "Organization Policies and Procedures",
            explanation: "This checks for established rules and procedures governing security.",
            defaultWeight: 5.0,
            activeWeight: 5.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Organization Policies and Procedures"),
      },
      {
            id: "network_security",
            name: "Network Security",
            explanation: "This section assesses your first line of defense against external threats.",
            defaultWeight: 7.0,
            activeWeight: 7.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Network Security"),
      },
      {
            id: "data_backup_and_recovery",
            name: "Data Backup and Recovery",
            explanation: "This helps us understand recovery capability after an attack.",
            defaultWeight: 7.0,
            activeWeight: 7.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Data Backup and Recovery"),
      },
      {
            id: "certifications",
            name: "Certifications",
            explanation: "This validates your commitment to industry-standard security practices.",
            defaultWeight: 4.0,
            activeWeight: 4.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Certifications"),
      },
      {
            id: "background_verification_and_employee_awareness",
            name: "Background Verification and Employee Awareness",
            explanation: "This assesses your personnel security and insider threat mitigation.",
            defaultWeight: 4.0,
            activeWeight: 4.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Background Verification and Employee Awareness"),
      },
      {
            id: "regulatory_compliance",
            name: "Regulatory Compliance",
            explanation: "This evaluates adherence to legal and regulatory security requirements.",
            defaultWeight: 5.0,
            activeWeight: 5.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Regulatory Compliance"),
      },
      {
            id: "ransomware_supplemental",
            name: "Ransomware Supplemental",
            explanation: "This section helps assess protection against ransomware.",
            defaultWeight: 5.0,
            activeWeight: 5.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Ransomware Supplemental"),
      },
      {
            id: "vulnerability_assessment_and_penetration_test",
            name: "Vulnerability Assessment and Penetration Test",
            explanation: "This evaluates your proactive identification of security weaknesses.",
            defaultWeight: 5.0,
            activeWeight: 5.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Vulnerability Assessment and Penetration Test"),
      },
      {
            id: "physical_perimeter_security",
            name: "Physical Perimeter Security",
            explanation: "This assesses protection of physical assets and facilities.",
            defaultWeight: 7.0,
            activeWeight: 7.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Physical Perimeter Security"),
      },
      {
            id: "endpoint_security",
            name: "Endpoint Security",
            explanation: "This evaluates protection of individual devices connecting to your network.",
            defaultWeight: 6.0,
            activeWeight: 6.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Endpoint Security"),
      },
      {
            id: "asset_management",
            name: "Asset Management",
            explanation: "This evaluates how you track and manage your IT assets.",
            defaultWeight: 6.0,
            activeWeight: 6.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Asset Management"),
      },
      {
            id: "iot_and_ot_network",
            name: "IoT and OT Network",
            explanation: "This assesses security of connected devices and operational technology.",
            defaultWeight: 9.0,
            activeWeight: 9.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "IoT and OT Network"),
      },
      {
            id: "dark_web_exposure",
            name: "Dark Web Exposure",
            explanation: "This checks for leaked credentials or data on the dark web.",
            defaultWeight: 2.0,
            activeWeight: 2.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Dark Web Exposure"),
      },
      {
            id: "active_directory_configuration",
            name: "Active Directory Configuration",
            explanation: "This evaluates the security of your central user and computer management.",
            defaultWeight: 3.0,
            activeWeight: 3.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Active Directory Configuration"),
      },
      {
            id: "change_patch_cadence",
            name: "Change / Patch Cadence",
            explanation: "This evaluates how quickly you update systems to fix vulnerabilities.",
            defaultWeight: 5.0,
            activeWeight: 5.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Change / Patch Cadence"),
      },
      {
            id: "incident_management_and_response",
            name: "Incident Management Response",
            explanation: "This assesses your readiness to respond to security incidents.",
            defaultWeight: 6.0,
            activeWeight: 6.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Incident Management Response"),
      },
      {
            id: "soc_and_soar_capabilities",
            name: "SOC and SOAR",
            explanation: "This evaluates your real-time threat monitoring and automated response capabilities.",
            defaultWeight: 4.0,
            activeWeight: 4.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "SOC and SOAR"),
      },
      {
            id: "identity_and_access_management",
            name: "Identity and Access Management",
            explanation: "This assesses how you control user access to systems and data.",
            defaultWeight: 6.0,
            activeWeight: 6.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "Identity and Access Management"),
      },
      {
            id: "dlp_and_dspm",
            name: "DLP and DSPM",
            explanation: "This assesses measures to prevent sensitive data loss.",
            defaultWeight: 4.0,
            activeWeight: 4.0,
            questions: ALL_QUESTIONS.filter((q) => q.domain === "DLP and DSPM"),
      },
]


export function calculateScore(domains: Domain[]): ScoringResult {
      const domainScores: ScoringResult["domainScores"] = []
      let totalContribution = 0
      const failedKillers: Array<{ id: string; text: string; domain: string }> = []

      for (const domain of domains) {
            let domainEarnedWeightedScore = 0
            let domainMaxPossibleWeightedScore = 0

            for (const question of domain.questions) {
                  const questionWeight = question.isKiller ? 3 : 1
                  const maxValue = 1.0 // Standardized max base score in Excel is 1

                  // Treat -1 (Unanswered) as 0 for scoring purposes
                  // Treat -2 (N/A) as 1.0 (Full points as per user request)
                  let effectiveResponse = 0
                  if (question.response === -1) effectiveResponse = 0
                  else if (question.response === -2) effectiveResponse = 1.0
                  else effectiveResponse = question.response

                  domainEarnedWeightedScore += effectiveResponse * questionWeight
                  domainMaxPossibleWeightedScore += maxValue * questionWeight

                  // Only trigger Killer Failure if EXPLICITLY "0" (No)
                  // -1 (Unanswered) does not trigger failure yet
                  if (question.isKiller && question.response === 0) {
                        failedKillers.push({ id: question.id, text: question.text, domain: question.domain })
                  }
            }

            const domainScoreRatio = domainMaxPossibleWeightedScore > 0 ? domainEarnedWeightedScore / domainMaxPossibleWeightedScore : 0
            const domainAchievement = domainScoreRatio * 100
            const contribution = (domainAchievement * domain.activeWeight) / 100

            domainScores.push({
                  domain: domain.name,
                  score: Math.round(domainAchievement * 100) / 100,
                  defaultWeight: domain.defaultWeight,
                  activeWeight: domain.activeWeight,
                  contribution: Math.round(contribution * 100) / 100,
                  maxScore: domainMaxPossibleWeightedScore,
                  earnedScore: Math.round(domainEarnedWeightedScore * 100) / 100,
            })

            totalContribution += contribution
      }

      // Match Excel exactly: ROUND(SUM(I105:I123), 1)
      const roundedScore = Math.min(Math.round(totalContribution * 10) / 10, 100)

      // Calculate Volatility Score (Sensitivity to top 3 domains)
      const sortedDomains = [...domainScores].sort((a, b) => b.score - a.score)
      const top3Avg = sortedDomains.slice(0, 3).reduce((acc, d) => acc + d.score, 0) / 3
      const bot3Avg = sortedDomains.slice(-3).reduce((acc, d) => acc + d.score, 0) / 3
      const volatilityScore = Math.round(Math.abs(top3Avg - bot3Avg))

      // Normalized Score (Contextualized performance)
      const normalizedScore = Math.min(Math.round((roundedScore / 85) * 100), 100)

      // Auto-decline if 2 or more killer controls fail
      const isAutoDeclined = failedKillers.length >= 2
      const { tier, premium } = getRiskTier(roundedScore, isAutoDeclined)

      // Identify gaps for narrative
      const industryId = domains[0]?.questions[0] ? (domains.flatMap(d => d.questions).find(q => q.response !== -1)?.id ? "default" : "default") : "default";
      // Note: We don't easily have industryId here, but we can pass it if we update the signature.
      // However, getRecommendations is exported and used elsewhere. 
      // Let's refine getDeclineNarrative to generateUnderwritingNarrative and take more context.

      return {
            totalScore: roundedScore,
            domainScores,
            riskTier: tier,
            premiumLoading: premium,
            autoDeclined: isAutoDeclined,
            failedKillers,
            volatilityScore,
            normalizedScore,
            declineNarrative: generateUnderwritingNarrative(tier, failedKillers, domainScores, domains),
      }
}

function getRiskTier(
      score: number,
      isAutoDeclined: boolean,
): { tier: "A" | "B" | "C" | "D"; premium: string } {
      const { thresholds, labels } = siteConfig.scoring;

      if (isAutoDeclined || score < thresholds.tierC) {
            return { tier: "D", premium: labels.tierD }
      }

      if (score >= thresholds.tierA) {
            return { tier: "A", premium: labels.tierA }
      }
      if (score >= thresholds.tierB) {
            return { tier: "B", premium: labels.tierB }
      }
      return { tier: "C", premium: labels.tierC }
}

function generateUnderwritingNarrative(
      riskTier: "A" | "B" | "C" | "D",
      failedKillers: Array<{ id: string; text: string; domain: string }>,
      domainScores: ScoringResult["domainScores"],
      domains: Domain[]
): string {
      let narrative = "";

      // 1. Summary Statement & Strategic Context
      switch (riskTier) {
            case "A":
                  narrative = "EXECUTIVE SUMMARY: The organization demonstrates an exemplary cyber security maturity level, characterized by robust controls and proactive risk management practices that align with international standards. This superior risk profile suggests a resilient infrastructure capable of defending against complex threat vectors, which is reflected in the 'Tier A' status. ";
                  break;
            case "B":
                  narrative = "EXECUTIVE SUMMARY: The organization exhibits a strong control environment with most critical security measures effectively implemented. While the core infrastructure is sound, the 'Tier B' designation indicates that certain optimization opportunities exist to further harden the perimeter and enhance internal visibility. ";
                  break;
            case "C":
                  narrative = "EXECUTIVE SUMMARY: The current assessment reveals a fair yet developing control maturity level. While foundational security protocols are active, significant variances in performance across different domains contribute to a higher risk volatility. The 'Tier C' status necessitates a focused effort on closing identified gaps to maintain corporate resilience. ";
                  break;
            case "D":
                  if (failedKillers.length >= 2) {
                        narrative = "EXECUTIVE SUMMARY: The risk posture has fallen below the structural underwriting requirements due to multiple failures in baseline security inhibitors. This 'Tier D' status indicates that the current control environment does not meet the minimum safety thresholds required for standard protocol adherence. ";
                  } else {
                        narrative = "EXECUTIVE SUMMARY: The organization shows a limited control maturity level with an aggregate score below the minimum underwriting threshold. The 'Tier D' classification reflects a need for a comprehensive systemic overhaul of various security domains to align with industry best practices. ";
                  }
                  break;
      }

      narrative += "This assessment serves as a point-in-time diagnostic of the organization's defensive capabilities against modern cyber-attacks.\n\n";

      // 2. Detailed Analysis of Critical Concerns
      const concerns: string[] = [];

      if (failedKillers.length > 0) {
            const killerTexts = failedKillers.map(k => k.text.replace(/\?$/, "")).join(", ");
            concerns.push(`DETAILED ANALYSIS: Critical architectural concerns were identified regarding the absence or inadequacy of ${killerTexts}. These 'Killer' controls are essential for structural integrity.`);
      }

      const lowMaturityDomains = domainScores
            .filter(ds => ds.score < 60 && ds.activeWeight > 0)
            .sort((a, b) => b.activeWeight - a.activeWeight)
            .slice(0, 3);

      if (lowMaturityDomains.length > 0) {
            const domainNames = lowMaturityDomains.map(d => d.domain).join(", ");
            concerns.push(`Furthermore, sub-optimal maturity levels observed in ${domainNames} present potential entry points for lateral movement or data exfiltration, significantly impacting the overall security posture.`);
      }

      if (concerns.length > 0) {
            narrative += concerns.join(" ") + "\n\n";
      } else {
            narrative += "DETAILED ANALYSIS: The assessment did not identify any critical inhibitor failures or high-volatility domain gaps. The existing control framework appears to be balanced across the evaluated infrastructure domains, providing a stable foundation for the organization's cyber defense strategy.\n\n";
      }

      // 3. Strategic Roadmap & Actionable Improvements
      const allFailedQuestions = domains.flatMap(d => d.questions).filter(q => q.response < 1 && !failedKillers.some(fk => fk.id === q.id));

      // Prioritize by domain weight
      allFailedQuestions.sort((a, b) => {
            const weightA = domainScores.find(ds => ds.domain === a.domain)?.activeWeight || 0;
            const weightB = domainScores.find(ds => ds.domain === b.domain)?.activeWeight || 0;
            return weightB - weightA;
      });

      const improvements = allFailedQuestions.slice(0, 3).map(q => q.text.replace(/\?$/, ""));
      if (improvements.length > 0) {
            narrative += `STRATEGIC ROADMAP: To significantly strengthen the security posture and potentially move to a more favorable risk tier, immediate attention should be directed towards the implementation or refinement of ${improvements.join(", ")}. `;
      }

      if (riskTier === "D") {
            narrative += "Successful remediation and re-evaluation of these critical gaps are essential prerequisites before the risk can be reconsidered for standard underwriting protocols. (Ref: SEC-AUTO-DECLINE)";
      } else if (riskTier === "C") {
            narrative += "Addressing these improvements systematically will not only qualify the organization for more favorable terms but also substantially reduce the potential for operational disruption.";
      } else {
            narrative += "Continuous monitoring, periodic red-teaming, and consistent updates to these specific controls will ensure sustained resilience against evolving threat vectors and zero-day vulnerabilities.";
      }

      return narrative;
}

export function getCurrentPremiumLoading(riskTier: string): string {
      const { labels } = siteConfig.scoring;
      switch (riskTier) {
            case "A": return labels.tierA
            case "B": return labels.tierB
            case "C": return labels.tierC
            case "D": return labels.tierD
            default: return "Pending"
      }
}

export function getIndustryWeights(industry: IndustryProfile | null, domains: Domain[]): Domain[] {
      if (!industry) {
            return domains.map(d => ({ ...d, activeWeight: d.defaultWeight }));
      }

      return domains.map(domain => {
            const weight = industry.domainWeights[domain.name];
            return {
                  ...domain,
                  activeWeight: weight !== undefined ? weight : 0
            };
      });
}

export interface Recommendation {
      questionId: string
      domain: string
      action: string
      impact: "High" | "Medium" | "Low"
      weight: number
}

export function getRecommendations(
      domains: Domain[],
      industryId: string
): Recommendation[] {
      const recommendations: Recommendation[] = []
      const industry = INDUSTRY_PROFILES.find(p => p.id === industryId)

      if (!industry) return []

      const allQuestions = domains.flatMap(d => d.questions)
      const failedQuestions = allQuestions.filter(q => q.response < 1)

      // Sort by weight of their domain and whether they are a killer question
      failedQuestions.sort((a, b) => {
            const weightA = industry.domainWeights[a.domain] || 0
            const weightB = industry.domainWeights[b.domain] || 0

            if (a.isKiller && !b.isKiller) return -1
            if (!a.isKiller && b.isKiller) return 1

            return weightB - weightA
      })

      // Take top 5 recommendations
      failedQuestions.slice(0, 5).forEach(q => {
            const weight = industry.domainWeights[q.domain] || 0
            let impact: "High" | "Medium" | "Low" = "Low"

            if (q.isKiller || weight >= 8) impact = "High"
            else if (weight >= 5) impact = "Medium"

            recommendations.push({
                  questionId: q.id,
                  domain: q.domain,
                  action: `Implement or improve: ${q.text}`,
                  impact,
                  weight
            })
      })

      return recommendations
}
