
export interface CompanyDossier {
    name: string;
    founded: string;
    hq: string;
    leadership: string;
    legacy: string;
    portfolio: string[];
    description: string;
    website?: string;
    businessModel?: string;
    cyberStats?: { label: string; value: number; reasoning: string }[];

    // Extended fields
    employees?: string;
    annualRevenue?: string;
    operationalReach?: string[];
    industriesServed?: string[];
    notableClients?: string[];
    subsidiaries?: string[];
    keyCompetitors?: string[];
    revenueStreams?: { label: string; description: string; percentage?: number }[];
    keyMilestones?: { year: string; event: string }[];
    digitalAssets?: string[];
    cloudInfrastructure?: string[];
    complianceFrameworks?: string[];
    recentSecurityIncidents?: { year: string; title: string; impact: string }[];
    supplyChainExposure?: string;
    regulatoryEnvironment?: string;
    cyberThreatNarrative?: string;
    
    // External OSINT Verification
    shodanIntelligence?: {
        assetCount: number;
        openPorts: { port: number; risk: 'critical' | 'warning' | 'standard' }[];
        vulnerabilities: string[];
        techStack: string[];
        lastScanDate: string;
    };
}

export const COMPANY_DOSSIERS: Record<string, CompanyDossier> = {
    "Avcon Forklifts": {
        name: "AVCON SYSTEMS (Material Handling Solutions)",
        founded: "1984",
        hq: "Bhiwandi / Thane, Maharashtra, India",
        leadership: "Mr. V.S. Sawarkar — Founder & MD (50+ years of industry leadership)",
        legacy: "Over 40 years of pioneering engineering excellence in the heavy manufacturing sector. Delivered 4,000+ custom-engineered infrastructure solutions across India. Export footprint spanning Africa, Southeast Asia, and the Middle East. Maintains an exceptional 98% client retention rate across 300+ long-term Annual Maintenance Contracts (AMC). Recognized as a foundational innovator under the 'Make in India' industrial capacity mandate.",
        portfolio: [
            "Battery-Operated Heavy Floor Cranes (250kg - 3000kg capacities)",
            "Integrated Hydraulic & Electric Pallet Trucks (Flameproof & Stainless Steel variations)",
            "Automated & Semi-Electric High-Reach Stackers",
            "Heavy-Duty Scissor Lifts (Pit-mounted, Self-Propelled, Custom capacities up to 20 tons)",
            "Industrial Battery Tow Trucks & Tuggars",
            "Mobile Dock Ramps & High-Tonnage Hydraulic Dock Levelers",
            "Bespoke 3D-Engineered Warehousing Layouts & Storage Solutions",
            "Comprehensive Annual Maintenance & Critical Fleet Refurbishment Services"
        ],
        description: "Avcon Systems is an entrenched, legacy manufacturer of high-precision material handling and industrial lifting equipment. Operating from a highly specialized, dedicated assembly facility in Bhiwandi, Maharashtra, the company functions as a mission-critical infrastructure provider to over 18 diverse industrial verticals, including pharmaceuticals, aerospace, and hyperscale e-commerce fulfilment networks.",
        website: "https://avconforklift.com",

        businessModel: "Avcon Systems operates a robust, vertically integrated B2B manufacturing and servicing framework. Core revenue generation is driven by the direct engineering, fabrication, and sale of advanced material handling machinery. A highly lucrative secondary revenue pipeline is sustained by 300+ high-margin Annual Maintenance Contracts (AMCs), which provide predictable capital flow and deep structural lock-in with enterprise clients. Over the past five years, the firm has achieved aggressive scaling through international export diversification and a pivot towards standardized bulk-manufacturing, severely amplifying their cyber and supply chain risk interconnectivity.",

        employees: "10–25 (Lean, high-expertise engineering & technical task force)",
        annualRevenue: "₹7.15 Cr (FY2025; Rapidly digitizing SME bracket)",

        operationalReach: [
            "Mumbai Metropolitan Region (MMR)", "Pune Industrial Corridor", "Bangalore Tech Hubs",
            "Chennai Manufacturing Zones", "Bhopal & Indore", "Kanpur", "Kolkata", "Baddi & Mohali (Pharma Hubs)",
            "Silvassa", "Middle East (Export Operations)", "Southeast Asia (Export Operations)", "Africa (Emerging Market Exports)"
        ],

        industriesServed: [
            "Pharmaceuticals & Life Sciences (Cold Chain Logistics)",
            "Hyperscale E-Commerce & Last-Mile Logistics",
            "Automotive Assembly & Heavy Engineering",
            "Food Processing & FMCG Distribution",
            "Chemical Processing & Rubber Manufacturing",
            "Large-Scale Warehousing & Distribution Centers",
            "Textile Milling & Heavy Packaging",
            "Marine Dockyards & Shipbuilding Facilities",
            "Aviation Maintenance & Government Undertakings"
        ],

        notableClients: [
            "RCF RIVIGO (Strategic Transport & Logistics)",
            "Sandoz (Novartis Pharma Division)",
            "Takeda Pharmaceuticals",
            "Tropicana (PepsiCo Beverage Supply Chain)",
            "Amazon (Automated E-Commerce Fulfilment Hubs)",
            "Raymond (Textiles & Integrated Consumer Goods)"
        ],

        revenueStreams: [
            {
                label: "Capital Equipment Engineering & Sales",
                description: "Primary revenue engine driven by high-ticket, direct B2B sales of complex, battery-operated and hydraulic material handling fleets to domestic and international facilities.",
                percentage: 60
            },
            {
                label: "Proprietary 3D Design & Customization Integration",
                description: "Premium consulting and engineering services utilizing advanced 3D CAD modeling to design hyper-customized storage and lifting solutions for irregular spatial constraints.",
                percentage: 15
            },
            {
                label: "Recurring Enterprise AMC Subscriptions",
                description: "300+ active Annual Maintenance Contracts providing a stable, high-margin revenue floor. Includes scheduled servicing, emergency SLA-bound breakdown support, and parts supply.",
                percentage: 20
            },
            {
                label: "International Export Expansion",
                description: "Emerging, high-growth revenue channel exporting heavy scissor lifts and motorized equipment to developing industrial sectors in Africa, Asia, and the Middle East.",
                percentage: 5
            }
        ],

        keyMilestones: [
            { year: "1984", event: "Incorporated by Mr. V.S. Sawarkar, establishing a foothold in the Indian material handling sector." },
            { year: "2007", event: "Commissioned a state-of-the-art manufacturing and assembly hub in Bhiwandi." },
            { year: "2012", event: "Digitized engineering operations with the introduction of 3D CAD technology, accumulating a massive proprietary IP blueprint library." },
            { year: "2019", event: "Executed first major international export contracts, requiring compliance with complex international trade and logistics digitization." },
            { year: "2021", event: "Pivoted to standardized bulk-manufacturing under government mandates, significantly digitizing the supply chain and procurement systems." },
            { year: "2025", event: "Achieved ₹7.15 Cr revenue milestone with an active service network spanning 15+ major Indian cities and international markets." }
        ],

        digitalAssets: [
            "Mission-Critical Customer ERP (Managing live AMC SLAs, billing histories, and service scheduling)",
            "Highly Confidential 3D CAD Blueprint Library (Decades of proprietary R&D and custom client schemas)",
            "Enterprise Client Database (4,000+ corporate records detailing client infrastructure and security protocols)",
            "Cloud-Integrated Financial & Payroll Management Systems (e.g., Tally Prime)",
            "Digital Procurement & Vendor Sync Portals (Managing JIT inventory for steel, motors, and controllers)",
            "International Export & Customs Clearance Documentation Repositories",
            "Digital Sales Funnel & Public-facing Web Infrastructure"
        ],

        supplyChainExposure: "Avcon Systems is structurally embedded within a highly volatile, multi-tiered global supply chain. They rely on critical imported electronics (controllers, lithium-ion arrays) and domestic heavy steel fabrication. A cyberattack compromising their digital procurement or vendor communication layers would instantly fracture their Just-In-Time (JIT) manufacturing schedules. Because their equipment actively unloads trucks at Amazon fulfilment centers and manages cold-chain pallets for Sandoz and Takeda, any failure by Avcon to meet AMC SLAs due to a ransomware lockout cascades into massive secondary delays for their clients—triggering severe contractual liability and potential litigation.",

        regulatoryEnvironment: "As a specialized manufacturer, Avcon is subject to complex machinery compliance frameworks (BIS, CE for exports). They must navigate DGFT (Directorate General of Foreign Trade) regulations, complex GST taxation networks, and increasingly stringent vendor-risk frameworks imposed by their multinational clients (e.g., Amazon Vendor Security Protocols, Pharma GxP compliance standards).",

        cyberThreatNarrative: "Despite possessing the operational surface area of a large enterprise, Avcon operates with the lean IT structure of an SME (10-25 employees). This asymmetry creates a catastrophic cyber risk profile. The company's highest concentration of value lies in its proprietary 3D CAD blueprints—the theft of which represents total IP obliteration by competitors. Furthermore, a ransomware attack paralyzing their AMC scheduling ERP would freeze their recurring revenue systems and trigger immediate SLA breaches with hyperscale clients like Amazon. Their expanding export operations also severely elevate their exposure to sophisticated targeted phishing and Business Email Compromise (BEC) attacks from foreign threat actors attempting to intercept high-value international wire transfers.",

        cyberStats: [
            { label: "IP Theft / Corporate Espionage (CAD Blueprints)", value: 88, reasoning: "Centralized, legacy digital storage of highly valuable proprietary engineering schemas makes the firm a prime target for competitor exfiltration." },
            { label: "Ransomware / AMC SLA Interruption Risk", value: 84, reasoning: "A cryptolocker event halting the service dispatch ERP instantly breaches SLAs with critical pharmaceutical and logistics clients, freezing ₹7.15Cr revenue." },
            { label: "Client Data Breach & Third-Party Liability", value: 77, reasoning: "Custody of infrastructure data for 4,000+ blue-chip clients creates extreme third-party liability if the firm is used as a supply-chain vector." },
            { label: "Vendor Procurement Disruption", value: 69, reasoning: "High reliance on international sub-components; digital disruption to the supply matrix causes immediate cascading production failure." },
            { label: "Business Email Compromise (BEC) & Wire Fraud", value: 65, reasoning: "Increasingly complex international shipping and export billing flows offer highly lucrative interception points for financial fraud syndicates." }
        ]
    },

    "Share India Insurance Brokers": {
        name: "SHARE INDIA INSURANCE BROKERS PVT LTD",
        founded: "2018",
        hq: "New Delhi, Delhi, India (Reg: 14, Dayanand Vihar)",
        leadership: "Mr. Ajay Kumar Patel (CEO) | Supported by Share India Group Board",
        legacy: "An elite IRDA-licensed (Code: IRDA/DB692) insurance intermediary backed by the massive financial heritage of the Share India Group (Est. 1994). Positioned as a premier risk-transfer architect, managing thousands of sensitive corporate policies and immense volumes of PII/PHI data. Blends decades of capital market trust with data-driven claims advocacy.",
        portfolio: [
            "Complex Industrial & Commercial Risk Engineering",
            "Enterprise Cyber Liability & Technology E&O Advisory",
            "Extensive Employee Benefits & Group Health Portfolios",
            "Global Marine & Commercial Cargo Insurance",
            "High-Net-Worth Life & Wealth Continuity Planning",
            "Aggressive Data-Driven Claims Management & Arbitration Solutions"
        ],
        description: "Operating under the formidable umbrella of the Share India Group, Share India Insurance Brokers is a leading institutional insurance advisory firm. They engineer complex risk transfer mechanisms for massive industrial conglomerates, logistics networks, and technology firms, acting as the critical nexus between corporate insureds and global underwriting syndicates.",
        website: "https://shareindiainsurance.com",
        
        businessModel: "A highly complex, data-intensive financial intermediary model. The firm earns aggressive brokerage commissions and risk-consulting fees by placing multi-million dollar corporate premiums. Their entire operational model relies on the frictionless, secure ingestion, analysis, and transmission of highly sensitive corporate financial data, employee health records (PHI), and proprietary risk assessments to external insurer APIs.",
        
        employees: "50–200 (Comprising licensed brokers, risk engineers, actuaries, and claims advocates)",
        annualRevenue: "Undisclosed (Fully integrated within the multi-billion rupee Share India Group financial ecosystem)",
        
        operationalReach: [
            "New Delhi (HQ)", "Mumbai Financial District", "Gujarat Manufacturing Belts",
            "Pan-India Corporate Servicing", "Global Reinsurance Coordination"
        ],
        
        industriesServed: [
            "Banking, Financial Services & Insurance (BFSI)",
            "Heavy Manufacturing & EPC",
            "Global Logistics & Supply Chain",
            "Healthcare & Mega-Hospitals",
            "Retail & Rapid E-Commerce",
            "Public Sector & Government Infrastructure"
        ],
        
        notableClients: [
            "Share India Securities (Internal Group Risk)",
            "Top-Tier MSME Manufacturing Conglomerates",
            "Major IT & Technology Service Providers",
            "National Logistics Fleets"
        ],
        
        revenueStreams: [
            { label: "Institutional Brokerage Commissions", description: "The primary revenue engine, capturing high percentages of large commercial premiums placed across property, casualty, and marine lines.", percentage: 55 },
            { label: "Specialized Risk Advisory Fees", description: "Consultative revenue generated through deep architectural risk assessments and bespoke policy structuring.", percentage: 20 },
            { label: "Claims Advocacy & Management", description: "Retained negotiation fees spanning the lengthy lifecycle of complex industrial and commercial claim settlements.", percentage: 15 },
            { label: "Employee Benefits Management", description: "Recurring administrative and placement revenue driven by managing thousands of employee health and life insurance portfolios.", percentage: 10 }
        ],
        
        keyMilestones: [
            { year: "1994", event: "Founding of the paramount Share India Group, establishing deep roots in Indian capital markets." },
            { year: "2018", event: "Incorporation and formal IRDA licensing as an independent insurance broking entity in New Delhi." },
            { year: "2021", event: "Aggressive expansion into complex liability, cyber risk, and industrial engineering portfolios." },
            { year: "2024", event: "Consolidation of digital policy management systems handling exponential volumes of client PII." }
        ],
        
        digitalAssets: [
            "Massive repositories of Client PII, PHI (Protected Health Information), and Directors' financial data",
            "Core CRM & Policy Management Architecture handling live premium processing",
            "Direct API integration nodes with India's largest general and life insurers",
            "IRDA Regulatory reporting and compliance data lakes",
            "Internal risk-scoring and proprietary underwriting algorithms"
        ],
        
        supplyChainExposure: "As a digital financial broker, Share India acts as a massive data router. They ingest ultra-sensitive data from clients and transmit it to insurers. Consequently, they are exposed to severe digital supply chain risk. If an insurer's API is compromised, the broker's systems could be back-doored. Conversely, if the broker is compromised, they become a trusted vector to infect both their corporate clients and the massive insurance carriers they partner with.",
        
        regulatoryEnvironment: "Operates in one of the highest-friction regulatory environments globally. Strictly governed by the Insurance Regulatory and Development Authority of India (IRDA). Mandated to comply with the draconian penalties of the Digital Personal Data Protection Act (DPDP 2023). Subject to rigorous, continuous cybersecurity and compliance audits, with severe legal consequences for data mishandling.",
        
        cyberThreatNarrative: "Share India Insurance Brokers sits on a digital goldmine of unencrypted human capital data (health records, salaries) and corporate financial vulnerabilities. A ransomware lock on their core broking platform would not merely halt revenue—it would prevent the placement of binding coverage, exposing clients to catastrophic uninsured losses. Their multi-million dollar premium transfer volumes make their finance desk a prime target for Business Email Compromise (BEC). A breach of PHI would attract instant IRDA censure, massive DPDP fines, and irreparable reputational annihilation within the close-knit corporate financial sector.",
        
        cyberStats: [
            { label: "Catastrophic PII/PHI Breach Liability", value: 96, reasoning: "Direct, concentrated custody of thousands of employee health records and executive financials. A breach triggers maximum DPDP 2023 regulatory penalties." },
            { label: "Ransomware & System Extortion", value: 89, reasoning: "A ransomware lock prevents timely policy renewals and bindings, leaving massive corporate clients technically uninsured and highly litigious." },
            { label: "Business Email Compromise (BEC) & Wire Fraud", value: 82, reasoning: "High-frequency, high-volume premium routing creates the perfect environment for threat actors to spoof and redirect massive financial transfers." },
            { label: "Third-Party Insurer API Exposure", value: 74, reasoning: "Heavy architectural reliance on external insurer portals; a breach at the carrier level can bleed directly back into the broker's digital ecosystem." },
            { label: "Regulatory Censure & License Revocation", value: 92, reasoning: "Strict IRDA oversight means a significant cyber incident could result in suspension of trading licenses alongside punitive financial fines." }
        ]
    },

    "Alphalogic Industries": {
        name: "ALPHALOGIC INDUSTRIES LIMITED",
        founded: "2014 (Listed entity acceleration post-2020)",
        hq: "Pune, Maharashtra, India (Chinchwad / Wadmukhwadi)",
        leadership: "Dynamic Enterprise Board & Senior Technical Direction",
        legacy: "A hyper-growth, publicly listed industrial manufacturing powerhouse. Deeply embedded into the logistics infrastructure of global e-commerce and automotive giants. A critical node in the new wave of automated, high-density warehousing solutions sweeping South Asia.",
        portfolio: [
            "Heavy-Duty Industrial Racking & Automated Pallet Systems",
            "Complex Slotted Angle & Column-Based Mezzanine Floors",
            "High-Density Compactor & Mobile Racking Architectures",
            "Cantilever Racking for Heavy Automotive & Aerospace Components",
            "End-to-End Logistics Infrastructure Design & CapEx Commissioning"
        ],
        description: "Alphalogic Industries manufactures the physical backbone of modern supply chains. From their major fabrication facilities in Pune, they design, forge, and install massive, highly complex structural storage solutions for Fortune 500 logistics hubs, pharmaceutical cold chains, and automotive assembly plants.",
        website: "https://alphalogicindustries.com",
        
        businessModel: "High-stakes, capital-intensive industrial manufacturing and project management. Revenue is recognized through enormous, multi-month turnkey installation contracts. The model requires extreme precision in CAD design, rapid steel procurement, and flawlessly timed physical installation schedules on client sites. Profitability is highly sensitive to supply chain synchronization and avoidance of contractual delay penalties.",
        
        employees: "50–150 (Scaling aggressively; mixed engineering and heavy fabrication workforce)",
        annualRevenue: "High-Growth Public Entity (Strong YoY multibagger expansion)",
        
        operationalReach: [
            "Pune & Mumbai Manufacturing Corridors",
            "Pan-India E-Commerce Fulfilment Zones",
            "National Pharmaceutical Clusters",
            "Rapidly expanding export consideration"
        ],
        
        industriesServed: [
            "Megascale E-Commerce & Third-Party Logistics (3PL)",
            "Automotive Assembly & Tier-1 Component Manufacturing",
            "FMCG Distribution & Cold-Chain Integration",
            "Pharmaceuticals & Healthcare Infrastructure",
            "IT Park Archival & High-Density Library Systems"
        ],
        
        notableClients: [
            "Global E-Commerce Giants (Amazon / Flipkart tier)",
            "Major Automotive OEMs (Tata Motors / Bajaj ecosystems)",
            "Leading National 3PL Providers",
            "Large-Scale Pharmaceutical Labs"
        ],
        
        revenueStreams: [
            { label: "Megascale Infrastructure Installations", description: "Massive, project-based CapEx injections resulting from the complete design, fabrication, and erection of warehousing systems.", percentage: 65 },
            { label: "Automated Mezzanine Solutions", description: "High-margin structural engineering projects that multiply client floor space, requiring complex structural integrity calculations.", percentage: 25 },
            { label: "Maintenance & Capacity Expansion", description: "Secondary revenue through long-term structural integrity checks and facility expansions for existing client bases.", percentage: 10 }
        ],
        
        keyMilestones: [
            { year: "2014", event: "Initial founding team aggregates industrial fabrication capabilities in Pune." },
            { year: "2020", event: "Aggressive corporate acceleration to capture the surging e-commerce logistics boom during global supply chain shifts." },
            { year: "2023", event: "Massive expansion into automated and structured mezzanine solutions; ISO 14001:2015 & BIFMA certifications locked." },
            { year: "2024", event: "Recognized as a premier listed entity in the industrial infrastructure sector." }
        ],
        
        digitalAssets: [
            "High-value proprietary CAD blueprints and structural load algorithms",
            "Massive Project Management ERPs syncing site-installation timelines",
            "Deep procurement ledgers tracking volatile global steel pricing and orders",
            "Client blueprints detailing the exact physical layouts of highly secure warehouses",
            "Corporate compliance, investor relations, and financial reporting data lakes"
        ],
        
        supplyChainExposure: "Alphalogic is deeply vulnerable to steel procurement volatility and vendor digital sync. A cyberattack on their ERP could sever their connection to steel rolling mills or fabrication sub-contractors. If massive structural components miss their JIT transport windows to a new e-commerce fulfilment center, Alphalogic faces crushing liquidated damages (delays penalties) from unforgiving corporate clients.",
        
        regulatoryEnvironment: "Subject to brutal physical and industrial safety compliance (BIS norms). As a listed entity, they must comply with SEBI cybersecurity and disclosure mandates. Any operational disruption must be publicly declared, risking immediate stock volatility.",
        
        cyberThreatNarrative: "Alphalogic is a prime target for pure operational extortion. Ransomware operators know that halting Alphalogic’s design servers or factory ERPs will derail multi-million dollar installation timelines across the country. Furthermore, their servers hold the detailed physical blueprints of major Amazon/Flipkart warehouses—data highly prized by industrial espionage actors. The combination of high public market visibility, aggressive operational scaling, and enormous contractual delay penalties creates maximum leverage for cyber extortionists.",
        
        cyberStats: [
            { label: "Catastrophic Operational Downtime", value: 91, reasoning: "Ransomware paralyzing the fabrication ERP prevents site delivery, triggering devastating liquidated damages on multi-million dollar contracts." },
            { label: "Physical Blueprint / Infrastructure Espionage", value: 86, reasoning: "Servers contain the exact physical layouts and structural weak points of major e-commerce and automotive client warehouses." },
            { label: "SEBI Compliance & Market Volatility Risk", value: 79, reasoning: "As a listed company, a major cyber breach mandates public disclosure, highly likely to trigger severe equity sell-offs and reputational damage." },
            { label: "Steel Supply Chain Intercept", value: 73, reasoning: "Digital disruption of the steel procurement interface halts the entire physical assembly line, creating an immovable bottleneck." },
            { label: "Intellectual Property Theft (Load Algorithms)", value: 68, reasoning: "Loss of proprietary structural calculation IP allows competitors to immediately undercut bids on massive mezzanine projects." }
        ]
    },

    "TCS": {
        name: "TATA CONSULTANCY SERVICES LTD. (TCS)",
        founded: "1968",
        hq: "Mumbai, Maharashtra, India (Global operations spanning 46+ nations)",
        leadership: "K Krithivasan (CEO & MD) | Anchored by Tata Sons",
        legacy: "The absolute zenith of India's digital ascendancy. The second-largest employer in the nation and one of the most powerful IT conglomerates on Earth. Responsible for architecting, deploying, and securing the core digital nervous system of the global Fortune 500, state governments, and international banking networks.",
        portfolio: [
            "Enterprise Artificial Intelligence, ML & Cognitive Automation (ignio)",
            "Global Cloud Infrastructure, Migration & Hybrid Datacenter Deployment",
            "Core Enterprise Application Services (SAP, Oracle, Salesforce)",
            "Military-Grade Cybersecurity, SOC & Digital Risk Management",
            "Bespoke Banking & Insurance IT Platforms (TCS BαNCS)",
            "Advanced Product Engineering, IoT & Embedded Systems Integration",
            "Massive-Scale BPO, Analytics & Intelligent Operations"
        ],
        description: "TCS is not merely an IT vendor; it is load-bearing global infrastructure. From clearing trillions of dollars in financial transactions via TCS BαNCS to managing the health records of entire nations, TCS writes the code that allows modern civilization to function.",
        website: "https://www.tcs.com",
        
        businessModel: "A hyperscale, global IT services provider. Revenue is generated via immense, multi-year, multi-billion dollar managed services and digital transformation contracts. They operate on an 'always-on' model, embedding hundreds of thousands of engineers directly into client networks to provide 24/7/365 operational continuity.",
        
        employees: "600,000+ (One of the largest civilian workforces globally)",
        annualRevenue: "₹2.55 Lakh Cr / $30.9 Billion USD (FY2024)",
        
        operationalReach: [
            "Hyper-density presence in North America, UK, and European Union",
            "Massive delivery centers across Tier-1 and Tier-2 Indian cities",
            "Deep operational hubs in APAC, Latin America, and the Middle East",
            "Active deployment in 46+ sovereign nations"
        ],
        
        industriesServed: [
            "Global Banking, Financial Services & Insurance (BFSI) [Dominant revenue segment]",
            "International Retail & Consumer Packaged Goods",
            "Heavy Manufacturing & Aerospace",
            "Global Life Sciences, Pharmaceuticals & Healthcare",
            "National Energy Grids & Utilities",
            "Federal Governments & Public Sector Infrastructure",
            "Global Telecom & High-Tech Media"
        ],
        
        notableClients: [
            "Citibank, JPMorgan Chase, SBI (Global Banking Tier)",
            "General Electric, Boeing, General Motors",
            "Major Sovereign Governments & Tax Authorities",
            "Over half of the Fortune 500 roster"
        ],
        
        revenueStreams: [
            { label: "Core IT Outsourcing & Managed Operations", description: "The titan revenue engine; massive, multi-decade contracts to keep the world's largest corporate networks secure and functional.", percentage: 45 },
            { label: "Digital Transformation & Cloud Migration", description: "Ultra-high value consulting engagements shifting global conglomerates from legacy mainframes to hybrid-cloud agility.", percentage: 30 },
            { label: "Proprietary Platform Sales (SaaS/PaaS)", description: "Licensing flagship systems like TCS BαNCS to run entire banking ecosystems, and ignio for AI-driven IT operations.", percentage: 15 },
            { label: "Next-Gen Cybersecurity Consulting", description: "Providing threat intelligence, penetration testing, and incident response to highly vulnerable multinational corporations.", percentage: 10 }
        ],
        
        keyMilestones: [
            { year: "1968", event: "Began its journey as a humble division of Tata Sons, pioneering software exports from India." },
            { year: "2004", event: "Executed a historic IPO on the BSE/NSE; became the first Indian IT firm to shatter the $1B revenue ceiling." },
            { year: "2018", event: "Became the first Indian company to surpass a $100 Billion market capitalization." },
            { year: "2024", event: "Solidified status as an unrelenting juggernaut with $30.9B revenue, driving global AI and Cloud transitions." }
        ],
        
        digitalAssets: [
            "Root access and administrative control over the data centers of global banks and airlines",
            "Unfathomable quantities of source code for the world's most critical applications",
            "Global HR and Payroll data for 600,000+ TCS employees",
            "TCS proprietary AI/ML source engines (ignio, MasterCraft)",
            "Trillions of bytes of client PII, PHI, and highly classified corporate IP"
        ],
        
        supplyChainExposure: "TCS represents the ultimate digital 'Trust Anchor.' They are the supply chain. A successful, deep penetration of TCS by a nation-state Advanced Persistent Threat (APT) would not be a mere corporate breach—it would be a global catastrophe. Threat actors could theoretically pivot through TCS's VPNs to infect the global banking system, paralyze electrical grids, or exfiltrate military-grade IP from aerospace clients.",
        
        regulatoryEnvironment: "Operates under crushing, multi-jurisdictional compliance frameworks concurrently: GDPR (Europe), HIPAA/SOX/CCPA (US), DPDP/SEBI (India), APRA (Australia), and countless federal banking regulations. They are audited continuously by the world's most aggressive regulatory bodies.",
        
        cyberThreatNarrative: "TCS engages in continuous digital warfare. Because they hold the keys to the Fortune 500, they face relentless, sophisticated attacks from Chinese, Russian, and North Korean state-sponsored syndicates seeking backdoors into global systemic infrastructure. Their attack surface is terrifyingly vast: 600,000+ human endpoints, thousands of remote connections, and constant integration with legacy client code. A systemic breach would trigger earth-shattering class-action lawsuits, multi-billion dollar regulatory fines across 40+ countries, and immense geopolitical fallout. For TCS, cyber defense is existential.",
        
        cyberStats: [
            { label: "God-Tier Supply Chain & APT Target", value: 99, reasoning: "A successful breach of TCS infrastructure allows nation-states to bypass the defenses of the global Fortune 500 simultaneously." },
            { label: "Global Class-Action Liability Matrix", value: 97, reasoning: "Custody of global BFSI and Healthcare data implies a breach would trigger immediate, synchronous lawsuits across dozens of sovereign courts." },
            { label: "Systemic Infrastructure Collapse (DDoS/Ransomware)", value: 95, reasoning: "If TCS delivery centers go offline, airline logistics fail, banking transactions halt, and critical utility management pauses." },
            { label: "Massive Insider Threat Surface", value: 88, reasoning: "Managing 600,000+ globally distributed employees creates an immense statistical probability for social engineering and credential theft." },
            { label: "Infinite Jurisdiction Regulatory Fines", value: 94, reasoning: "Simultaneous violations of GDPR, HIPAA, and DPDP would yield compounding, multi-billion dollar regulatory devastation." }
        ]
    },
    "Royal Sundaram": {
        name: "ROYAL SUNDARAM GENERAL INSURANCE CO. LTD.",
        founded: "2000",
        hq: "Vishranthi Melaram Towers, Chennai, India",
        leadership: "Mr. M. S. Sreedhar (MD) | Backed by the Sundaram Finance Group",
        legacy: "A historic pioneer in the Indian financial landscape, Royal Sundaram was the first private sector general insurance company to be licensed in India (2000). Backed by the 65-year-old Sundaram Finance Group, the firm has set the gold standard for retail insurance innovation, claims integrity, and digital-first underwriting for over two decades.",
        portfolio: [
            "Comprehensive Motor & Electric Vehicle Coverage",
            "Advanced Health & Critical Illness Portfolios (Lifeline)",
            "Complex Industrial Fire & Engineering Risks",
            "Specialized Marine & Inland Transit Insurance",
            "Large-Scale Employee Benefits & Liability Structures",
            "Elite 'm-Chatra' Digital Self-Service Ecosystem"
        ],
        description: "Royal Sundaram is a cornerstone of India's private insurance sector. As a multi-line general insurer, they provide mission-critical risk transfer solutions to millions of retail customers and thousands of corporate entities, functioning as a vital pillar of the nation's financial stability.",
        website: "https://royalsundaram.in",
        
        businessModel: "A high-velocity, data-intensive underwriting model driven by a multi-channel distribution engine. The firm leverages a vast network of agents, brokers, and banking partners (Affinity) to ingest retail premiums at scale. Their operational superiority is maintained through 'm-Chatra'—a proprietary digital platform that automates the entire policy lifecycle from issuance to settlement, necessitating extreme cybersecurity posture.",
        
        employees: "2,000+ (Specialized underwriters, actuaries, and claims advocates)",
        annualRevenue: "₹3,500 Cr+ (Gross Written Premium momentum)",
        
        operationalReach: [
            "Chennai (HQ)", "150+ Branch Nodes Pan-India", 
            "Global Reinsurance Syndicates", "Extensive Digital Agent Network"
        ],
        
        industriesServed: [
            "Retail & Individual Consumers",
            "Automotive & Transportation",
            "Banking, Financial Services & Insurance (BFSI)",
            "Industrial Manufacturing & EPC",
            "Global Logistics & Marine Trade"
        ],
        
        notableClients: [
            "Sundaram Finance Group (Internal Ecosystem)",
            "Major Nationalized & Private Banks",
            "Top-Tier Automotive OEMs",
            "Millions of Individual Policyholders"
        ],
        
        revenueStreams: [
            { label: "Retail Premium Ingestion", description: "High-volume revenue engine driven by motor, health, and travel insurance sales through physical and digital channels.", percentage: 50 },
            { label: "Institutional Commercial Underwriting", description: "Enterprise-level risk management fees for fire, marine, and liability covers for large-scale industrial projects.", percentage: 30 },
            { label: "Claims & Risk Engineering Advisory", description: "Consultative revenue generated through technical risk assessments and industrial safety engineering.", percentage: 10 },
            { label: "Investment & Reserve Management", description: "Significant financial income generated from the strategic investment of regulatory reserves in capital markets.", percentage: 10 }
        ],
        
        keyMilestones: [
            { year: "2000", event: "Becomes India's first private sector general insurance company to receive an IRDA license." },
            { year: "2008", event: "Pioneered the 'Cashless Claims' mechanism for health insurance in the Indian market." },
            { year: "2015", event: "Launched 'm-Chatra,' a revolutionary mobile-first platform for agent and customer empowerment." },
            { year: "2024", event: "Celebrating 24 years of operational excellence with over ₹3,500 Cr in Annual GWP." }
        ],
        
        digitalAssets: [
            "Protected Health Information (PHI) of millions of health policyholders",
            "Proprietary 'm-Chatra' underwriting and claims engine",
            "Direct API bridges with 10+ major Indian banks and thousands of fintech nodes",
            "Vast repositories of corporate risk data and industrial blueprints",
            "Regulatory reporting data lakes for IRDAI and GSTN compliance"
        ],
        
        supplyChainExposure: "As a major insurance node, Royal Sundaram is deeply interconnected with the healthcare and automotive supply chains. Their digital platforms sync daily with thousands of hospitals (TPA networks) and garages. A compromise of these API bridges could allow threat actors to perform massive-scale insurance fraud or exfiltrate private health data from the entire healthcare ecosystem.",
        
        regulatoryEnvironment: "Royal Sundaram operates in a hyper-regulated environment. They are mandated to comply with IRDAI’s stringent 'Cyber Security Framework for Insurers' and the newly enacted DPDP Act (2023). Non-compliance during a data breach could result in penalties of up to ₹250 Cr and immediate suspension of underwriting licenses.",
        
        cyberThreatNarrative: "Royal Sundaram is a high-value target for nation-state actors and cyber-extortionists due to its custody of millions of sensitive health records (PHI). A ransomware attack on their claims settlement engine would immediately halt hospital payouts, creating a national healthcare crisis for their policyholders. Furthermore, their premium collection portals handle massive daily financial volumes, making them a prime target for sophisticated Business Email Compromise (BEC) and payment redirection fraud.",
        
        cyberStats: [
            { label: "PII/PHI Data Sovereignty Breach", value: 94, reasoning: "Direct custody of millions of medical and financial records. DPDP 2023 compliance renders this the single highest financial liability." },
            { label: "Claims Lifecycle Interruption (Ransomware)", value: 87, reasoning: "Absolute dependency on 'm-Chatra' for real-time claims processing. Downtime causes immediate client distress and reputational fallout." },
            { label: "Third-Party Affinity API Exposure", value: 81, reasoning: "Deep digital integration with banking and broker nodes creates a massive attack surface beyond their direct control." },
            { label: "Financial Transaction & Premium Fraud", value: 74, reasoning: "High frequency of digital premium payments and claim payouts offers multiple points for interception and redirect fraud." },
            { label: "Regulatory Censure & License Suspension", value: 89, reasoning: "IRDAI mandates strict cybersecurity hygiene; a significant breach invites aggressive audits and potential trade restrictions." }
        ]
    },
    "L&T Technology Services": {
        name: "L&T TECHNOLOGY SERVICES LIMITED (LTTS)",
        founded: "2012",
        hq: "Vadodara, Gujarat, India (Corporate) | R&D Excellence in Bangalore",
        leadership: "Amit Chadha (CEO & MD) | Part of the Larsen & Toubro Conglomerate",
        legacy: "The global titan of 'Pure-Play' Engineering Research & Development (ER&D). Born from the $27B legacy of Larsen & Toubro, LTTS architects the world’s most advanced digital twins, autonomous vehicles, and sustainable industrial ecosystems. A mission-critical engineering node for 69 of the Fortune 500.",
        portfolio: [
            "Advanced Autonomous Mobility & ADAS Engineering",
            "Smart Manufacturing & Industrial IoT (Industry 4.0)",
            "Pervasive AI, Generative AI & Digital Twin Workflows",
            "Next-Gen Medical Devices & Digital Health Platforms",
            "Energy Transition & Net-Zero Sustainability Engineering",
            "Cyber-Physical System Security (OT/ICS hardening)"
        ],
        description: "L&T Technology Services is a global engineering powerhouse. They provide end-to-end design, development, and testing services for products and processes across five major segments: Transportation, Industrial Products, Telecom & Hi-Tech, Medical Devices, and Plant Engineering.",
        website: "https://www.ltts.com",
        businessModel: "A high-expertise, project-based engineering services model. Revenue is generated through long-term R&D partnerships, managed engineering centers, and bespoke IP-led digital transformation contracts for the world's largest automotive, aerospace, and medical device manufacturers.",
        employees: "23,000+ (Elite specialization in engineering and R&D)",
        annualRevenue: "₹10,670 Cr / $1.26 Billion+ (FY2025)",
        operationalReach: [
            "India (Bangalore, Vadodara, Pune, Chennai)", "North America (Silicon Valley, Texas, Michigan)", 
            "Europe (Germany, France, Nordic Region)", "Japan & Korea Tech Hubs"
        ],
        industriesServed: [
            "Autonomous Mobility & Automotive",
            "Industrial Manufacturing & Heavy Engineering",
            "High-Tech, Telecom & Media",
            "Life Sciences & Medical Technology",
            "Energy, Utilities & Smart Cities"
        ],
        notableClients: [
            "NVIDIA (AI Strategic Partnership)",
            "Fortune 500 Automotive OEMs",
            "Global MedTech Conglomerates",
            "Major Aerospace Defense Contractors"
        ],
        revenueStreams: [
            { label: "Engineering R&D Services", description: "Direct project-based revenue for product design and process engineering across global manufacturing clients.", percentage: 55 },
            { label: "Digital Transformation & AI Consulting", description: "High-margin revenue from implementing pervasive AI, GenAI, and IIoT architectures for industrial enterprises.", percentage: 30 },
            { label: "IP-led Solutions & Licensing", description: "Revenue from proprietary frameworks and software-defined-engineering platforms.", percentage: 15 }
        ],
        keyMilestones: [
            { year: "2012", event: "Incorporated as a dedicated engineering services subsidiary of L&T Group." },
            { year: "2016", event: "Successfully launched IPO on the Indian exchanges (BSE/NSE)." },
            { year: "2024", event: "Acquired Intelliswift to severely amplify GenAI and software engineering capabilities." },
            { year: "2025", event: "Crossed the $1.26 Billion revenue milestone with 105+ innovation centers worldwide." }
        ],
        digitalAssets: [
            "Global Innovation & R&D Center Vaults (105+ locations)",
            "Massive Proprietary IP Repositories for Industrial AI/ML",
            "Design Schematics & Digital Twins for Fortune 500 Heavy Infrastructure",
            "Mission-Critical Client PLM (Product Lifecycle Management) data lakes",
            "Advanced OT/ICS simulation and testing environments"
        ],
        supplyChainExposure: "LTTS is the digital brain of its clients' supply chains. By managing the R&D and design schematics for 69 Fortune 500 firms, LTTS is a massive 'single point of failure.' A breach at LTTS allows threat actors to exfiltrate the future product blueprints of multiple global industries simultaneously. Furthermore, their deep integration into client OT/ICS systems means a compromised LTTS update could theoretically halt manufacturing lines across entire continents.",
        regulatoryEnvironment: "Subject to a complex web of international trade compliance, export controls, and rigorous data protection laws (GDPR, CCPA, India's DPDP 2023). Must also comply with sector-specific safety standards like ISO 26262 for automotive and ISO 13485 for medical devices.",
        cyberThreatNarrative: "As a premier R&D hub for global aerospace and defense contractors, LTTS is a Tier-1 target for nation-state espionage (APTs). These actors seek the 'Blueprints of the Future'—autonomous driving algorithms, smart manufacturing schematics, and medical IP. A ransomware attack paralyzing their R&D centers would trigger catastrophic delay penalties and potentially expose sensitive client schematics. Their high public profile and heritage in the L&T group make them a prime target for high-value Business Email Compromise (BEC) and financial redirect fraud during large acquisition disbursements.",
        cyberStats: [
            { label: "IP/Espionage Exfiltration Risk (R&D Schematics)", value: 95, reasoning: "Host to the core design intelligence of 69 Fortune 500 firms; theft of this IP is a global competitive catastrophe." },
            { label: "OT/ICS Supply Chain Pivot Vector", value: 88, reasoning: "Direct engineering access to client manufacturing lines; a breach at LTTS could be used as a vector to infect multinational factory floors." },
            { label: "Ransomware & R&D Operational Downtime", value: 84, reasoning: "Paralysis of the design ERPs and PLM systems instantly triggers massive contractual liquidated damages from Fortune 500 clients." },
            { label: "Geopolitical APT Interest", value: 92, reasoning: "Strategic importance to Indian and global infrastructure makes them a prime target for state-sponsored threat actors seeking industrial leverage." },
            { label: "Regulatory Data Privacy Liability", value: 76, reasoning: "Custody of employee and client data across 40+ countries creates a massive, multi-jurisdictional compliance surface." }
        ]
    }
};

export const getDossier = (orgName: string | null | undefined): CompanyDossier | null => {
    if (!orgName) return null;
    const q = orgName.toLowerCase().trim();
    
    if (!q) return null; // Safety check: prevent empty string from matching 'Avcon'

    // Strategy 1: Exact match
    if (COMPANY_DOSSIERS[orgName]) return COMPANY_DOSSIERS[orgName];

    // Strategy 2: Case-insensitive exact match on key
    const exactKey = Object.keys(COMPANY_DOSSIERS).find(k => k.toLowerCase() === q);
    if (exactKey) return COMPANY_DOSSIERS[exactKey];

    // Strategy 3: Key contains query OR query contains key (partial match)
    const partialKey = Object.keys(COMPANY_DOSSIERS).find(k =>
        k.toLowerCase().includes(q) || q.includes(k.toLowerCase())
    );
    if (partialKey) return COMPANY_DOSSIERS[partialKey];

    // Strategy 4: Any meaningful word in query matches any meaningful word in key
    const queryWords = q.split(/\s+/).filter(w => w.length > 2);
    const wordKey = Object.keys(COMPANY_DOSSIERS).find(k => {
        const keyWords = k.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return queryWords.some(qw => keyWords.some(kw => kw.includes(qw) || qw.includes(kw)));
    });
    if (wordKey) return COMPANY_DOSSIERS[wordKey];

    // Strategy 5: Match against the dossier's own name field
    const nameMatch = Object.values(COMPANY_DOSSIERS).find(d =>
        d.name.toLowerCase().includes(q) || q.includes(d.name.toLowerCase().split(' ')[0])
    );
    if (nameMatch) return nameMatch;

    return null;
};
