// Seed content for UBTI AI Atlas.
// Everything marked isSample can be removed in one click from Admin → Dashboard.
// Industry photos are hot-linked from Unsplash (free licence). Replace any of them in Admin → Industries.
// Certification badges are the official Microsoft Learn badge images.

import type {
  Certification,
  CompanySettings,
  FlowStep,
  Industry,
  Maturity,
  Metric,
  Platform,
  PlatformCategory,
  Post,
  Project,
  Visibility,
} from '../lib/types';

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;
const T0 = '2026-06-01T09:00:00.000Z';

// ─── Industries ──────────────────────────────────────────────────────────────
const industriesRaw: [string, string, string, string, string, string][] = [
  // slug, name, short, icon, unsplash id, description
  ['real-estate', 'Real Estate & PropTech', 'Real Estate', 'Building2', 'photo-1512453979798-5ea266f8880c', 'Lease, SPA and portfolio intelligence for developers, brokers and asset managers.'],
  ['construction', 'Construction & Infrastructure', 'Construction', 'HardHat', 'photo-1535732759880-bbd5c7265e3f', 'Project controls, RFIs, drawings and site progress — answered by agents, not spreadsheets.'],
  ['manufacturing', 'Manufacturing & Industrial', 'Manufacturing', 'Factory', 'photo-1716191299980-a6e8827ba10b', 'Optimise production and supply, predict quality issues and automate vendor workflows.'],
  ['logistics', 'Shipping, Logistics & Supply Chain', 'Shipping & Logistics', 'Ship', 'photo-1578575437130-527eed3abbec', 'Track shipments, forecast delays and read every freight document automatically.'],
  ['healthcare', 'Healthcare & Life Sciences', 'Healthcare', 'HeartPulse', 'photo-1519494026892-80bbd2d6fd0d', 'Summarise records, surface patient insights and cut admin time for clinicians.'],
  ['financial-services', 'Financial Services & Banking', 'Financial Services', 'TrendingUp', 'photo-1611974789855-9c2a0a7236a3', 'Risk, compliance and reporting agents grounded in your filings and ledgers.'],
  ['insurance', 'Insurance', 'Insurance', 'ShieldCheck', 'photo-1758227365187-016878604d94', 'Faster claims, actuarial analytics and policy Q&A for carriers and brokers.'],
  ['retail', 'Retail & E-commerce', 'Retail', 'ShoppingBag', 'photo-1481437156560-3205f6a55735', 'Store performance, inventory and customer insight across POS, ERP and online stores.'],
  ['energy', 'Energy, Oil & Gas', 'Oil & Gas', 'Flame', 'photo-1629540946404-ebe133e99f49', 'Turnaround planning, asset integrity and HSE intelligence for operators.'],
  ['government', 'Government & Public Sector', 'Government', 'Landmark', 'photo-1523292562811-8fa7962a78c8', 'Citizen services, document processing and bilingual voice agents.'],
  ['agriculture', 'Agriculture & Food Processing', 'Agriculture & Food', 'Wheat', 'photo-1560493676-04071c5f467b', 'Yield, production planning and quality for growers and food processors.'],
  ['automotive', 'Automotive & Mobility', 'Automotive', 'Car', 'photo-1567789884554-0b844b597180', 'Predict quality issues on the line and turn warranty data into fixes.'],
  ['travel', 'Travel, Tourism & Hospitality', 'Travel & Hospitality', 'Hotel', 'photo-1445019980597-93fa8acb246c', 'Guest concierge agents, revenue insights and multilingual service.'],
  ['aerospace', 'Aerospace & Aviation', 'Aerospace', 'Plane', 'photo-1540575861501-7cf05a4b125a', 'Predictive maintenance for fleets and instant answers from technical manuals.'],
  ['education', 'Education', 'Education', 'GraduationCap', 'photo-1580537659466-0a9bfa916a54', 'Student insights, instant reports and assistants for faculty and admissions.'],
];

export const industries: Industry[] = industriesRaw.map(([slug, name, shortName, icon, img, description], i) => ({
  id: slug,
  slug,
  name,
  shortName,
  icon,
  imageUrl: U(img),
  description,
  order: i + 1,
}));

// ─── Platforms (systems we put an AI layer on) ──────────────────────────────
type P = [name: string, vendor: string, desc: string, patterns: string[], via: string];
const NLSQL = 'Ask in plain English (NL → SQL)';
const RAG = 'RAG over documents & records';
const ACT = 'Agent actions via API';
const ALERT = 'Anomaly & threshold alerts';
const REPORT = 'Auto-generated reports';
const SUM = 'Summaries & drafting';

const platformGroups: Record<PlatformCategory, P[]> = {
  'Data platforms & warehouses': [
    ['Microsoft Fabric', 'Microsoft', 'Lakehouse, warehouse and real-time analytics in one SaaS platform.', [NLSQL, REPORT, ALERT, 'Fabric data agents'], 'Native — Lakehouse / Warehouse / Mirroring'],
    ['Azure Synapse Analytics', 'Microsoft', 'Enterprise data warehouse and big-data analytics.', [NLSQL, REPORT], 'SQL endpoint, Fabric shortcut'],
    ['Azure Databricks', 'Microsoft / Databricks', 'Spark lakehouse for data engineering and ML.', [NLSQL, REPORT, 'Feature pipelines for ML'], 'Unity Catalog, SQL warehouse, Fabric mirroring'],
    ['Snowflake', 'Snowflake', 'Cloud data warehouse.', [NLSQL, REPORT], 'SQL connector, Fabric mirroring'],
    ['Google BigQuery', 'Google Cloud', 'Serverless data warehouse.', [NLSQL, REPORT], 'BigQuery API / connector'],
    ['Amazon Redshift', 'AWS', 'Cloud data warehouse on AWS.', [NLSQL, REPORT], 'JDBC/ODBC, pipeline copy'],
    ['Azure Data Lake Storage', 'Microsoft', 'Scalable object storage for analytics.', [RAG, REPORT], 'OneLake shortcut'],
    ['Amazon S3', 'AWS', 'Object storage for files and data lakes.', [RAG, REPORT], 'OneLake shortcut, SDK'],
    ['Power BI', 'Microsoft', 'Semantic models and reports.', ['Q&A over semantic models', REPORT, 'Copilot narratives'], 'XMLA / REST, Fabric'],
    ['Tableau', 'Salesforce', 'Business intelligence dashboards.', [REPORT, 'Insight summaries'], 'REST API, Hyper extracts'],
  ],
  'Relational databases': [
    ['SQL Server', 'Microsoft', 'On-prem and IaaS SQL Server databases.', [NLSQL, ALERT, ACT], 'On-prem gateway, Fabric mirroring'],
    ['Azure SQL Database', 'Microsoft', 'Managed SQL in Azure.', [NLSQL, ALERT, ACT], 'Native connector, Fabric mirroring'],
    ['PostgreSQL', 'Open source', 'Postgres on-prem or Azure / AWS / GCP.', [NLSQL, 'pgvector semantic search', ACT], 'Direct connection, pipelines'],
    ['MySQL / MariaDB', 'Oracle / MariaDB', 'Popular open-source relational databases.', [NLSQL, ACT], 'Direct connection, pipelines'],
    ['Oracle Database', 'Oracle', 'Oracle DB incl. Autonomous Database.', [NLSQL, REPORT, ALERT], 'Gateway, pipelines, mirroring where available'],
    ['IBM Db2', 'IBM', 'Db2 for LUW and z/OS.', [NLSQL, REPORT], 'Gateway, pipelines'],
    ['SAP HANA', 'SAP', 'In-memory database behind SAP S/4HANA and BW.', [NLSQL, REPORT], 'SAP connector, pipelines'],
    ['Teradata', 'Teradata', 'Enterprise data warehouse.', [NLSQL, REPORT], 'Pipelines'],
  ],
  'NoSQL, search & vector': [
    ['Azure Cosmos DB', 'Microsoft', 'Globally distributed NoSQL and vector database.', [RAG, 'Vector search', ACT], 'Native SDK, Fabric mirroring'],
    ['MongoDB', 'MongoDB', 'Document database incl. Atlas Vector Search.', [RAG, 'Vector search', ACT], 'Driver, Atlas API'],
    ['Amazon DynamoDB', 'AWS', 'Serverless key-value / document database.', [ACT, REPORT], 'SDK, pipelines'],
    ['Apache Cassandra', 'Open source', 'Wide-column database for high write throughput.', [REPORT, ALERT], 'Driver, pipelines'],
    ['Redis', 'Redis', 'In-memory store, cache and vector index.', ['Semantic cache', 'Vector search'], 'Driver'],
    ['Elasticsearch / OpenSearch', 'Elastic / AWS', 'Search and log analytics.', [RAG, 'Hybrid search', ALERT], 'REST API'],
    ['Azure AI Search', 'Microsoft', 'Hybrid keyword + vector retrieval for RAG.', [RAG, 'Hybrid search'], 'Native — indexers & skillsets'],
    ['Firebase Firestore', 'Google', 'Serverless document database with vector search.', [RAG, ACT], 'Admin SDK'],
    ['Neo4j', 'Neo4j', 'Graph database for connected data.', ['GraphRAG', 'Relationship insights'], 'Bolt driver'],
  ],
  ERP: [
    ['Dynamics 365 Finance & Operations', 'Microsoft', 'Finance, supply chain and manufacturing ERP.', [NLSQL, ACT, REPORT, ALERT], 'Dataverse, OData, Fabric Link'],
    ['Dynamics 365 Business Central', 'Microsoft', 'ERP for small and mid-size businesses.', [NLSQL, ACT, REPORT], 'API v2.0, Power Platform connector'],
    ['SAP S/4HANA', 'SAP', 'SAP\'s current-generation ERP suite.', [NLSQL, ACT, REPORT], 'OData / BAPI, SAP connector'],
    ['SAP ECC', 'SAP', 'Classic SAP ERP Central Component.', [REPORT, ACT], 'RFC / BAPI, SAP connector'],
    ['Oracle Fusion Cloud ERP', 'Oracle', 'Oracle\'s cloud ERP suite.', [NLSQL, ACT, REPORT], 'REST APIs, BI Publisher extracts'],
    ['Oracle E-Business Suite', 'Oracle', 'Oracle on-prem ERP.', [REPORT, ACT], 'Database views, integration repository'],
    ['Oracle NetSuite', 'Oracle', 'Cloud ERP for growing companies.', [NLSQL, ACT, REPORT], 'SuiteTalk REST, SuiteQL'],
    ['Odoo', 'Odoo', 'Open-source ERP for sales, stock and accounting.', [NLSQL, ACT, REPORT], 'XML-RPC / JSON-RPC API'],
    ['Infor CloudSuite', 'Infor', 'Industry-specific cloud ERP.', [REPORT, ACT], 'ION API'],
    ['Tally Prime', 'Tally Solutions', 'Accounting and inventory, widely used in India.', [NLSQL, REPORT], 'XML / ODBC'],
    ['Zoho Books', 'Zoho', 'Online accounting.', [REPORT, ACT], 'REST API'],
    ['Sage', 'Sage', 'Accounting and ERP (Sage 200, Intacct, X3).', [REPORT, ACT], 'REST APIs'],
  ],
  'CRM & customer service': [
    ['Dynamics 365 Sales', 'Microsoft', 'CRM for pipeline and account management.', [SUM, ACT, 'Next-best action'], 'Dataverse, Copilot Studio'],
    ['Dynamics 365 Customer Service', 'Microsoft', 'Case management and omnichannel service.', [SUM, ACT, 'Case triage'], 'Dataverse, Copilot Studio'],
    ['Dataverse', 'Microsoft', 'Data platform behind Power Platform and Dynamics 365.', [NLSQL, ACT], 'Native — Copilot Studio, Power Automate'],
    ['Salesforce Sales Cloud', 'Salesforce', 'CRM for sales teams.', [SUM, ACT, 'Opportunity insights'], 'REST / Bulk API, Power Platform connector'],
    ['Salesforce Service Cloud', 'Salesforce', 'Customer service and case management.', [SUM, ACT, 'Case triage'], 'REST API, Power Platform connector'],
    ['HubSpot', 'HubSpot', 'Marketing, sales and service CRM.', [SUM, ACT], 'REST API'],
    ['Zoho CRM', 'Zoho', 'CRM for SMB and mid-market.', [SUM, ACT], 'REST API'],
    ['Zendesk', 'Zendesk', 'Customer support ticketing.', [SUM, 'Ticket triage', ACT], 'REST API'],
    ['Freshdesk / Freshservice', 'Freshworks', 'Help desk and IT service management.', [SUM, 'Ticket triage'], 'REST API'],
  ],
  'ITSM, HR & operations': [
    ['ServiceNow', 'ServiceNow', 'IT service, HR and operations workflows.', ['Ticket triage', 'Self-service agent', ACT], 'Table API, Power Platform connector'],
    ['Jira & Jira Service Management', 'Atlassian', 'Work tracking and service desk.', ['Ticket triage', SUM, ACT], 'REST API'],
    ['Workday', 'Workday', 'HR, payroll and finance.', ['HR policy Q&A', REPORT], 'REST / RaaS'],
    ['SAP SuccessFactors', 'SAP', 'HR and talent management.', ['HR policy Q&A', REPORT], 'OData API'],
    ['IBM Maximo', 'IBM', 'Enterprise asset management.', ['Work-order intelligence', ALERT, ACT], 'REST / OSLC API'],
  ],
  'Documents & collaboration': [
    ['SharePoint', 'Microsoft', 'Document libraries and intranet sites.', [RAG, SUM, 'Contract & clause extraction'], 'Microsoft Graph, Copilot Studio knowledge'],
    ['OneDrive', 'Microsoft', 'Personal and shared files.', [RAG, SUM], 'Microsoft Graph'],
    ['Microsoft Teams', 'Microsoft', 'Chat, meetings and channels — where agents live.', ['Agent in Teams', SUM, 'Meeting actions'], 'Bot Framework, Copilot Studio'],
    ['Outlook / Exchange', 'Microsoft', 'Email, calendars and shared mailboxes.', ['Inbox triage', SUM, ACT], 'Microsoft Graph'],
    ['Excel & CSV files', 'Any', 'The spreadsheets that run the business.', [NLSQL, REPORT, 'Reconciliation'], 'Upload, SharePoint, OneLake'],
    ['PDFs & scanned documents', 'Any', 'Invoices, contracts, forms and manuals.', ['OCR + field extraction', RAG], 'Azure AI Document Intelligence'],
    ['Google Drive / Workspace', 'Google', 'Docs, Sheets and Drive files.', [RAG, SUM], 'Drive API'],
    ['Box', 'Box', 'Enterprise content management.', [RAG, SUM], 'REST API'],
    ['Confluence', 'Atlassian', 'Team wiki and knowledge base.', [RAG, SUM], 'REST API'],
  ],
  'Industry systems': [
    ['Shopify', 'Shopify', 'E-commerce storefronts and orders.', [NLSQL, REPORT, ACT, 'Returns & exchanges automation'], 'Admin GraphQL API'],
    ['Adobe Commerce (Magento)', 'Adobe', 'Enterprise e-commerce.', [REPORT, ACT], 'REST / GraphQL API'],
    ['AVEVA PI System', 'AVEVA', 'Industrial time-series historian.', [ALERT, 'Predictive maintenance', REPORT], 'PI Web API, Fabric Real-Time'],
    ['Procore', 'Procore', 'Construction project management.', [SUM, 'RFI & submittal assistant'], 'REST API'],
    ['Yardi', 'Yardi', 'Property management and real-estate accounting.', [REPORT, 'Lease insights'], 'API / data exports'],
    ['Guidewire', 'Guidewire', 'Core systems for P&C insurers.', ['Claims triage', REPORT], 'Cloud APIs'],
    ['HL7 FHIR / EHR systems', 'Standard', 'Electronic health records via FHIR.', [SUM, 'Patient insights'], 'FHIR REST, Azure Health Data Services'],
    ['CargoWise', 'WiseTech Global', 'Freight forwarding and customs platform.', ['Shipment tracking', ALERT, 'Document AI'], 'eAdaptor / API'],
  ],
  'Streaming, IoT & APIs': [
    ['Apache Kafka', 'Open source / Confluent', 'Event streaming.', [ALERT, 'Real-time agents'], 'Fabric Eventstream, consumers'],
    ['Azure Event Hubs', 'Microsoft', 'Managed event ingestion.', [ALERT, 'Real-time agents'], 'Fabric Eventstream'],
    ['Azure IoT Hub', 'Microsoft', 'Device telemetry ingestion and management.', [ALERT, 'Predictive maintenance'], 'Event routing, Fabric Real-Time'],
    ['MQTT / OPC UA', 'Standard', 'Industrial and IoT messaging protocols.', [ALERT, 'Predictive maintenance'], 'Edge gateway'],
    ['REST & GraphQL APIs', 'Any', 'Any system with an API.', [ACT, 'MCP tools for agents'], 'Custom connector, MCP server'],
    ['SFTP / EDI feeds', 'Any', 'Batch files from partners and banks.', ['Reconciliation', REPORT], 'Pipelines, Logic Apps'],
  ],
};

export const platforms: Platform[] = Object.entries(platformGroups).flatMap(([category, list], gi) =>
  list.map(([name, vendor, description, aiPatterns, connectVia], i) => {
    const slug = name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return {
      id: slug,
      slug,
      name,
      vendor,
      category: category as PlatformCategory,
      description,
      aiPatterns,
      connectVia,
      order: gi * 100 + i,
    };
  }),
);

// ─── Microsoft certifications (official Microsoft Learn badge images) ───────
const BADGE = 'https://learn.microsoft.com/en-us/media/learn/certification/badges/';
const learn = (code: string) => `https://learn.microsoft.com/en-us/credentials/browse/?terms=${encodeURIComponent(code)}`;
const levelBadge = { Fundamentals: 'microsoft-certified-fundamentals-badge.svg', Associate: 'microsoft-certified-associate-badge.svg', Expert: 'microsoft-certified-expert-badge.svg' } as const;

type C = [code: string, name: string, level: Certification['level'], track: Certification['track'], badge: string, holders: number, status?: 'retired', note?: string];
const certsRaw: C[] = [
  ['AB-100', 'Agentic AI Business Solutions Architect Expert', 'Expert', 'AI', BADGE + levelBadge.Expert, 0],
  ['AI-103', 'Azure AI App and Agent Developer Associate', 'Associate', 'AI', BADGE + levelBadge.Associate, 0, undefined, 'Successor to AI-102'],
  ['AI-102', 'Azure AI Engineer Associate', 'Associate', 'AI', BADGE + levelBadge.Associate, 0, 'retired', 'Retired June 2026 — still valid until expiry'],
  ['AI-901', 'Azure AI Fundamentals', 'Fundamentals', 'AI', BADGE + levelBadge.Fundamentals, 1, undefined, 'Earned via AI-900 or AI-901'],
  ['AB-730', 'AI Business Professional', 'Business', 'AI', BADGE + 'ai-business-professional.svg', 0],
  ['AB-731', 'AI Transformation Leader', 'Business', 'AI', BADGE + 'ai-transformation-leader.svg', 0],
  ['AB-900', 'Microsoft 365 Copilot and Agent Administration Fundamentals', 'Fundamentals', 'AI', BADGE + levelBadge.Fundamentals, 0],
  ['DP-100', 'Azure Data Scientist Associate', 'Associate', 'AI', BADGE + levelBadge.Associate, 0, 'retired', 'Retired June 2026 — successor exam AI-300'],
  ['DP-600', 'Fabric Analytics Engineer Associate', 'Associate', 'Data & Fabric', BADGE + levelBadge.Associate, 1],
  ['DP-700', 'Fabric Data Engineer Associate', 'Associate', 'Data & Fabric', BADGE + levelBadge.Associate, 1],
  ['PL-300', 'Power BI Data Analyst Associate', 'Associate', 'Data & Fabric', BADGE + levelBadge.Associate, 0],
  ['DP-900', 'Azure Data Fundamentals', 'Fundamentals', 'Data & Fabric', BADGE + levelBadge.Fundamentals, 0],
  ['PL-500', 'Power Automate RPA Developer Associate', 'Associate', 'Power Platform', BADGE + levelBadge.Associate, 1],
  ['PL-400', 'Power Platform Developer Associate', 'Associate', 'Power Platform', BADGE + levelBadge.Associate, 0, undefined, 'Moving to AB-400'],
  ['PL-200', 'Power Platform Functional Consultant Associate', 'Associate', 'Power Platform', BADGE + levelBadge.Associate, 0],
  ['PL-600', 'Power Platform Solution Architect Expert', 'Expert', 'Power Platform', BADGE + levelBadge.Expert, 0],
  ['PL-900', 'Power Platform Fundamentals', 'Fundamentals', 'Power Platform', BADGE + levelBadge.Fundamentals, 0],
  ['AZ-305', 'Azure Solutions Architect Expert', 'Expert', 'Azure', BADGE + levelBadge.Expert, 0],
  ['AZ-204', 'Azure Developer Associate', 'Associate', 'Azure', BADGE + levelBadge.Associate, 0],
  ['AZ-104', 'Azure Administrator Associate', 'Associate', 'Azure', BADGE + levelBadge.Associate, 0],
  ['AZ-900', 'Azure Fundamentals', 'Fundamentals', 'Azure', BADGE + levelBadge.Fundamentals, 0],
];

export const certifications: Certification[] = certsRaw.map(([code, name, level, track, badgeUrl, holders, status, note], i) => ({
  id: code.toLowerCase(),
  code,
  name: `Microsoft Certified: ${name}`,
  level,
  track,
  badgeUrl,
  learnUrl: learn(code),
  holders,
  status: status ?? 'active',
  note,
  show: true,
  order: i + 1,
}));

// ─── Sample projects ─────────────────────────────────────────────────────────
interface SP {
  slug: string;
  title: string;
  tagline: string;
  industry: string;
  extra?: string[];
  client: string;
  region: string;
  problem: string;
  solution: string;
  impact: string;
  metrics: Metric[];
  features: string[];
  tech: string[];
  platforms: string[];
  flow: (string | FlowStep)[];
  maturity: Maturity;
  reuse: number;
  weeks: number;
  featured?: boolean;
  visibility?: Visibility;
}

const sp: SP[] = [
  {
    slug: 'lease-spa-intelligence', title: 'Lease & SPA Intelligence', industry: 'real-estate', extra: ['government'],
    tagline: 'Reads every sale & purchase agreement and lease, extracts the clauses that matter and answers questions in seconds.',
    client: 'Real-estate developer, UAE & India', region: 'UAE · India',
    problem: 'Legal and leasing teams manually review hundreds of SPAs and leases to track payment plans, handover dates, escalation clauses and renewal windows. Missed dates cost money and the knowledge lives in a few people\'s heads.',
    solution: 'Documents land in SharePoint, Azure AI Document Intelligence extracts the text and tables, and an Azure OpenAI pipeline pulls 40+ clause types into a structured register in Fabric. A Copilot Studio agent answers questions like *"Which leases in Tower B escalate above 5% next year?"* with links to the exact clause.',
    impact: 'Clause review time drops from hours to minutes per contract, and renewal and handover dates are tracked automatically with Teams alerts.',
    metrics: [{ label: 'Review time per contract', value: '-80%' }, { label: 'Clause types extracted', value: '40+' }],
    features: ['Clause extraction with confidence scores', 'Renewal & escalation alerts in Teams', 'Arabic + English documents', 'Portfolio dashboard in Power BI'],
    tech: ['Azure AI Document Intelligence', 'Azure OpenAI', 'Copilot Studio', 'Microsoft Fabric', 'Power BI'],
    platforms: ['sharepoint', 'microsoft-fabric', 'azure-ai-search', 'yardi', 'microsoft-teams'],
    flow: ['SharePoint contract library', 'Document Intelligence OCR', 'Azure OpenAI clause extraction', 'Fabric clause register', 'Copilot Studio agent in Teams'],
    maturity: 'template', reuse: 85, weeks: 4, featured: true,
  },
  {
    slug: 'site-progress-rfi-copilot', title: 'Site Progress & RFI Copilot', industry: 'construction',
    tagline: 'Answers RFIs from drawings, specs and daily reports — and drafts the response for the engineer to approve.',
    client: 'MEP contractor, UAE', region: 'UAE',
    problem: 'Engineers spend hours searching drawings, specs and past RFIs to answer each new request for information, and daily site reports are rarely read beyond the day they are written.',
    solution: 'An agent indexes drawings, specifications, method statements and daily reports. When an RFI arrives it finds the relevant sections, drafts a response with citations and routes it for approval. Weekly, it summarises progress and risks across sites.',
    impact: 'Faster RFI turnaround and a searchable memory of every site decision.',
    metrics: [{ label: 'RFI first-draft time', value: '-65%' }, { label: 'Documents indexed', value: '12k+' }],
    features: ['RFI drafting with citations', 'Weekly progress & risk digest', 'Electrical & mechanical spec Q&A', 'Approval workflow in Power Automate'],
    tech: ['Azure OpenAI', 'Azure AI Search', 'Power Automate', 'Copilot Studio'],
    platforms: ['procore', 'sharepoint', 'microsoft-teams', 'outlook-exchange'],
    flow: ['Drawings, specs & daily reports', 'Azure AI Search index', 'RFI agent drafts answer', 'Engineer approves in Teams', 'Response logged to project system'],
    maturity: 'pilot', reuse: 75, weeks: 6, featured: true,
  },
  {
    slug: 'line-quality-sentinel', title: 'Line Quality Sentinel', industry: 'manufacturing', extra: ['automotive'],
    tagline: 'Predicts quality issues on the production line before the defect reaches the end-of-line test.',
    client: 'Industrial components manufacturer', region: 'India',
    problem: 'Quality defects were found only at final inspection, after scrap and rework had already happened. Sensor data sat in the historian and nobody had time to correlate it with defect logs.',
    solution: 'Telemetry streams from the PI historian into Fabric Real-Time Intelligence. A model scores each batch for defect risk, and an agent explains the likely cause in plain language to the shift supervisor, with the recommended adjustment.',
    impact: 'Earlier intervention on risky batches and fewer escapes to final inspection.',
    metrics: [{ label: 'Scrap & rework', value: '-22%' }, { label: 'Alert lead time', value: '35 min' }],
    features: ['Real-time defect risk score', 'Root-cause explanation in plain English', 'Shift handover summaries', 'Teams alerts to supervisors'],
    tech: ['Microsoft Fabric Real-Time Intelligence', 'Azure Machine Learning', 'Azure OpenAI', 'Power BI'],
    platforms: ['aveva-pi-system', 'azure-iot-hub', 'microsoft-fabric', 'sql-server'],
    flow: ['PI historian & IoT sensors', 'Fabric Eventstream', 'Defect-risk model', 'Explainer agent', 'Supervisor alert in Teams'],
    maturity: 'production', reuse: 60, weeks: 8, featured: true,
  },
  {
    slug: 'freight-document-ai', title: 'Freight Invoice & Document AI', industry: 'logistics',
    tagline: 'Reads freight invoices, bills of lading and customs documents, then audits them against the rate card.',
    client: 'Freight forwarder, India', region: 'India · GCC',
    problem: 'Thousands of carrier invoices and shipping documents arrive by email every month in different formats. Finance keys them in by hand and overcharges slip through.',
    solution: 'Shared mailboxes feed Azure AI Document Intelligence and an LLM extraction step. Every invoice line is matched to the shipment and contracted rate; mismatches are flagged for review and clean invoices post to the ERP automatically.',
    impact: 'Touchless processing for most invoices and recovered overcharges.',
    metrics: [{ label: 'Invoices processed touchless', value: '78%' }, { label: 'Overcharges caught', value: '3.1%' }],
    features: ['Invoice OCR in any layout', 'Rate-card audit', 'Exception queue with reasons', 'ERP posting'],
    tech: ['Azure AI Document Intelligence', 'Azure OpenAI', 'Logic Apps', 'Power Automate'],
    platforms: ['outlook-exchange', 'pdfs-and-scanned-documents', 'cargowise', 'dynamics-365-finance-and-operations'],
    flow: ['Shared mailbox', 'Document Intelligence OCR', 'LLM field extraction', 'Rate-card audit', 'ERP posting / exception queue'],
    maturity: 'template', reuse: 90, weeks: 3, featured: true,
  },
  {
    slug: 'shipment-delay-forecaster', title: 'Shipment Delay Forecaster', industry: 'logistics', extra: ['manufacturing', 'retail'],
    tagline: 'Forecasts which shipments will be late — and tells the customer before they ask.',
    client: 'Logistics provider', region: 'GCC',
    problem: 'Customer-service teams learned about delays from angry customers. Milestone data existed but was spread across carriers and the TMS.',
    solution: 'Milestones from the TMS and carrier APIs land in Fabric. A model predicts ETA slippage per shipment, and an agent drafts proactive customer updates and answers "where is my shipment?" in chat.',
    impact: 'Fewer inbound status calls and proactive delay communication.',
    metrics: [{ label: 'WISMO calls', value: '-40%' }],
    features: ['ETA slippage prediction', 'Proactive customer emails', 'Chat agent for shipment status'],
    tech: ['Microsoft Fabric', 'Azure Machine Learning', 'Azure OpenAI', 'Copilot Studio'],
    platforms: ['cargowise', 'microsoft-fabric', 'rest-and-graphql-apis', 'dynamics-365-customer-service'],
    flow: ['TMS & carrier APIs', 'Fabric Lakehouse', 'ETA model', 'Customer update agent', 'Email / chat'],
    maturity: 'pilot', reuse: 70, weeks: 6,
  },
  {
    slug: 'patient-record-summariser', title: 'Patient Record Summariser', industry: 'healthcare',
    tagline: 'One-page clinical summaries from years of notes, labs and discharge letters.',
    client: 'Multi-specialty hospital group', region: 'India',
    problem: 'Clinicians spend the first minutes of every consultation scrolling through fragmented records.',
    solution: 'Records are pulled over FHIR into Azure Health Data Services. An agent creates a structured summary — problems, medications, recent labs, red flags — with every line linked to its source note.',
    impact: 'Less time on chart review and more time with the patient.',
    metrics: [{ label: 'Chart review time', value: '-50%' }],
    features: ['Source-linked summaries', 'Medication & allergy highlights', 'Doctor feedback loop'],
    tech: ['Azure Health Data Services', 'Azure OpenAI', 'Azure AI Search'],
    platforms: ['hl7-fhir-ehr-systems', 'azure-sql-database', 'azure-ai-search'],
    flow: ['EHR via FHIR', 'Health Data Services', 'Summariser agent', 'Clinician review', 'Summary in EHR'],
    maturity: 'poc', reuse: 55, weeks: 6, visibility: 'internal',
  },
  {
    slug: '10k-peer-risk-analyzer', title: '10-K Peer Risk Analyzer', industry: 'financial-services', extra: ['insurance'],
    tagline: 'Compares risk factors across peer annual filings so ERM teams see emerging risks first.',
    client: 'Global risk & insurance advisory', region: 'US · Global',
    problem: 'Enterprise risk teams read dozens of peer 10-K filings every year to benchmark their risk register — a slow, manual exercise.',
    solution: 'A Copilot Studio agent ingests peer 10-K risk-factor sections, classifies each risk into the client\'s taxonomy and highlights new, removed and escalated risks versus the prior year. Analysts chat with it and export a peer comparison.',
    impact: 'Peer benchmarking in an afternoon instead of weeks.',
    metrics: [{ label: 'Benchmarking effort', value: '-85%' }, { label: 'Peers compared', value: '25' }],
    features: ['Year-over-year risk diff', 'Taxonomy mapping', 'Chat with filings', 'Excel/PPT export'],
    tech: ['Copilot Studio', 'Azure OpenAI', 'Azure AI Search', 'Power Automate'],
    platforms: ['sharepoint', 'pdfs-and-scanned-documents', 'azure-ai-search', 'excel-and-csv-files'],
    flow: ['Peer 10-K filings', 'Risk-factor extraction', 'Taxonomy classification', 'Copilot Studio agent', 'Peer comparison export'],
    maturity: 'production', reuse: 80, weeks: 4, featured: true,
  },
  {
    slug: 'any-data-qa-agent', title: 'Any-Data Q&A Agent', industry: 'financial-services', extra: ['retail', 'manufacturing', 'logistics', 'healthcare', 'education'],
    tagline: 'Ask your ERP, CRM or warehouse a question in plain English — get the number, the chart and the SQL.',
    client: 'Template — any industry', region: 'Global',
    problem: 'Every business question becomes a ticket for the data team, and dashboards never answer the next question.',
    solution: 'A Fabric data agent sits on top of mirrored ERP/CRM data. It translates questions into SQL against a governed semantic layer, returns the answer with a chart, and can schedule the answer as a daily report or turn it into an action item.',
    impact: 'Self-service answers for business users with governance intact.',
    metrics: [{ label: 'Time to first answer', value: '< 10 s' }, { label: 'Deployment', value: '2 weeks' }],
    features: ['NL → SQL with guardrails', 'Charts & explanations', 'Scheduled reports', 'Action items to Teams / Planner'],
    tech: ['Microsoft Fabric', 'Azure AI Foundry', 'Azure OpenAI', 'Power BI'],
    platforms: ['microsoft-fabric', 'dynamics-365-finance-and-operations', 'salesforce-sales-cloud', 'oracle-database', 'sap-s-4hana', 'sql-server'],
    flow: ['ERP / CRM / databases', 'Mirroring into OneLake', 'Semantic model', 'AI Foundry data agent', 'Answers, reports & actions'],
    maturity: 'template', reuse: 95, weeks: 2, featured: true,
  },
  {
    slug: 'schedule-p-loss-development', title: 'Schedule P Loss Development Studio', industry: 'insurance',
    tagline: 'Builds loss triangles and development factors from regulatory data in minutes, with an AI analyst on top.',
    client: 'P&C actuarial consultancy', region: 'US',
    problem: 'Actuaries rebuilt loss development triangles by hand from Schedule P data for every peer study.',
    solution: 'Fabric notebooks ingest the Schedule P data feed, build paid and incurred triangles by line of business, compute age-to-age factors and benchmarks, and an agent explains movements and outliers.',
    impact: 'Repeatable peer studies and more time for judgement.',
    metrics: [{ label: 'Triangle build time', value: 'days → minutes' }],
    features: ['Triangles by line of business', 'Development factors & benchmarks', 'Outlier commentary'],
    tech: ['Microsoft Fabric', 'PySpark', 'Azure OpenAI', 'Power BI'],
    platforms: ['microsoft-fabric', 'excel-and-csv-files', 'power-bi'],
    flow: ['Schedule P data feed', 'Fabric notebooks', 'Triangles & factors', 'Analyst agent', 'Power BI report'],
    maturity: 'production', reuse: 70, weeks: 5,
  },
  {
    slug: 'claims-triage-agent', title: 'Claims Triage Agent', industry: 'insurance',
    tagline: 'Reads FNOL emails and documents, scores complexity and routes each claim to the right handler.',
    client: 'General insurer, GCC', region: 'GCC',
    problem: 'First notice of loss arrives by email and phone in every format; triage is manual and inconsistent.',
    solution: 'An agent extracts claim details from emails and attachments, checks policy coverage, scores complexity and fraud signals, and creates the claim with a recommended route.',
    impact: 'Faster first contact and consistent triage.',
    metrics: [{ label: 'Triage time', value: '-60%' }],
    features: ['FNOL extraction', 'Coverage check', 'Complexity & fraud signals', 'Policy Q&A'],
    tech: ['Azure OpenAI', 'Azure AI Document Intelligence', 'Power Automate'],
    platforms: ['guidewire', 'outlook-exchange', 'dynamics-365-customer-service'],
    flow: ['FNOL email & docs', 'Extraction', 'Coverage & risk scoring', 'Claim created & routed'],
    maturity: 'pilot', reuse: 65, weeks: 6,
  },
  {
    slug: 'store-sales-pulse', title: 'Store Sales Pulse Agent', industry: 'retail',
    tagline: 'Every store manager gets daily sales vs target — and can ask why.',
    client: 'Multi-brand fashion retailer', region: 'India',
    problem: 'Store-wise performance was compiled manually from POS and e-commerce exports every morning.',
    solution: 'POS, ERP and online orders flow into Fabric. Each morning store managers receive a personalised MTD vs target email, and can chat with an agent to drill into categories, staff and stock-outs.',
    impact: 'Zero manual reporting and faster action on under-performing stores.',
    metrics: [{ label: 'Manual reporting', value: '0 hrs/day' }, { label: 'Stores covered', value: '30+' }],
    features: ['Daily store emails', 'Target tracking', 'Category drill-down chat', 'Stock-out alerts'],
    tech: ['Microsoft Fabric', 'Azure OpenAI', 'Power BI', 'Power Automate'],
    platforms: ['shopify', 'odoo', 'microsoft-fabric', 'excel-and-csv-files'],
    flow: ['POS, ERP & Shopify', 'Fabric Lakehouse', 'Targets & KPIs', 'Store pulse agent', 'Email & chat'],
    maturity: 'production', reuse: 85, weeks: 3,
  },
  {
    slug: 'turnaround-intelligence', title: 'Turnaround Intelligence Platform', industry: 'energy',
    tagline: 'Plans and tracks plant turnarounds with live scope, cost and risk insight.',
    client: 'National oil company, UAE', region: 'UAE',
    problem: 'Turnaround scope, work orders and contractor progress lived in separate systems; overruns were spotted too late.',
    solution: 'Work orders and schedules are unified into a turnaround data model. Dashboards track scope growth and critical path, and an agent answers "what is driving the overrun in Unit 3?" with evidence.',
    impact: 'Earlier visibility of scope growth and schedule risk.',
    metrics: [{ label: 'Scope changes flagged', value: '2 weeks earlier' }],
    features: ['Scope growth tracking', 'Critical path risk', 'Contractor progress', 'Overrun Q&A'],
    tech: ['Python', 'Streamlit', 'Azure OpenAI', 'Microsoft Fabric'],
    platforms: ['ibm-maximo', 'sap-s-4hana', 'excel-and-csv-files', 'microsoft-fabric'],
    flow: ['Maximo / SAP work orders', 'Turnaround data model', 'Risk analytics', 'Turnaround agent', 'Daily brief'],
    maturity: 'pilot', reuse: 50, weeks: 8, visibility: 'internal',
  },
  {
    slug: 'citizen-voice-agent', title: 'Bilingual Citizen Voice Agent', industry: 'government', extra: ['travel', 'healthcare'],
    tagline: 'Arabic and English voice agent that answers service questions and books appointments 24/7.',
    client: 'Government entity, UAE', region: 'UAE',
    problem: 'Call centres were overwhelmed by repetitive service queries outside working hours.',
    solution: 'A real-time voice agent built on Azure OpenAI answers from approved knowledge, checks application status via API and books appointments, handing over to a human with full context when needed.',
    impact: 'Round-the-clock service and shorter queues.',
    metrics: [{ label: 'Calls fully resolved by agent', value: '55%' }],
    features: ['Arabic + English speech', 'Status lookup via API', 'Appointment booking', 'Warm hand-off to agents'],
    tech: ['Azure OpenAI Realtime', 'Azure AI Speech', 'Azure Functions', 'Copilot Studio'],
    platforms: ['servicenow', 'dynamics-365-customer-service', 'rest-and-graphql-apis'],
    flow: ['Phone / web call', 'Realtime voice agent', 'Knowledge + status APIs', 'Booking or hand-off'],
    maturity: 'pilot', reuse: 75, weeks: 6, featured: true,
  },
  {
    slug: 'production-planning-optimiser', title: 'Food Production Planning Optimiser', industry: 'agriculture', extra: ['manufacturing'],
    tagline: 'Turns demand, shelf-life and capacity into a daily production plan planners can question.',
    client: 'Food processor', region: 'India',
    problem: 'Planners balanced perishable stock, demand and line capacity in spreadsheets every evening.',
    solution: 'Demand forecasts and inventory feed an optimiser that proposes the next day\'s plan; an agent explains trade-offs and re-plans when a line goes down.',
    impact: 'Less waste and fewer stock-outs.',
    metrics: [{ label: 'Waste from expiry', value: '-18%' }],
    features: ['Shelf-life aware planning', 'What-if re-planning', 'Plan explanations'],
    tech: ['Microsoft Fabric', 'Python optimisation', 'Azure OpenAI'],
    platforms: ['sap-s-4hana', 'microsoft-fabric', 'excel-and-csv-files'],
    flow: ['ERP orders & stock', 'Demand forecast', 'Optimiser', 'Planner agent'],
    maturity: 'poc', reuse: 50, weeks: 6,
  },
  {
    slug: 'warranty-claims-insight', title: 'Warranty Claims Insight Agent', industry: 'automotive',
    tagline: 'Clusters warranty claims and technician notes into failure patterns engineering can act on.',
    client: 'Automotive component supplier', region: 'India',
    problem: 'Warranty claims contained rich technician comments that nobody had time to read at scale.',
    solution: 'Claims and free-text notes are embedded and clustered into failure modes, linked to production batches, and summarised weekly for quality engineering.',
    impact: 'Faster detection of systemic failures.',
    metrics: [{ label: 'Failure-pattern detection', value: 'weeks → days' }],
    features: ['Failure-mode clustering', 'Batch traceability', 'Weekly quality digest'],
    tech: ['Azure OpenAI embeddings', 'Microsoft Fabric', 'Power BI'],
    platforms: ['sap-s-4hana', 'salesforce-service-cloud', 'microsoft-fabric'],
    flow: ['Warranty claims & notes', 'Embeddings & clustering', 'Batch linkage', 'Quality digest'],
    maturity: 'poc', reuse: 60, weeks: 5,
  },
  {
    slug: 'guest-concierge-agent', title: 'Guest Concierge Agent', industry: 'travel',
    tagline: 'A multilingual concierge on WhatsApp and web that knows the property and books services.',
    client: 'Hotel group, UAE', region: 'UAE',
    problem: 'Front desks handle the same guest questions hundreds of times a day.',
    solution: 'An agent grounded in property knowledge answers guests in their language, books spa and dining via API and escalates requests to the right team.',
    impact: 'Faster guest responses and more ancillary bookings.',
    metrics: [{ label: 'Guest queries handled by agent', value: '70%' }],
    features: ['Multilingual chat', 'Bookings via API', 'Escalation to staff'],
    tech: ['Azure OpenAI', 'Copilot Studio', 'Azure Communication Services'],
    platforms: ['dynamics-365-customer-service', 'rest-and-graphql-apis', 'sharepoint'],
    flow: ['Guest on WhatsApp / web', 'Concierge agent', 'Booking APIs', 'Staff escalation'],
    maturity: 'template', reuse: 80, weeks: 3,
  },
  {
    slug: 'fleet-predictive-maintenance', title: 'Fleet Predictive Maintenance', industry: 'aerospace',
    tagline: 'Predicts component failures from flight and maintenance data and answers from the manuals.',
    client: 'MRO provider', region: 'GCC',
    problem: 'Unscheduled maintenance grounded aircraft; technicians searched thousands of manual pages for procedures.',
    solution: 'Sensor and maintenance logs train failure-risk models per component. A technician assistant retrieves the exact manual procedure and past fixes for a fault code.',
    impact: 'Fewer unscheduled removals and faster troubleshooting.',
    metrics: [{ label: 'Troubleshooting time', value: '-35%' }],
    features: ['Component risk scores', 'Manual & fault-code Q&A', 'Maintenance planning'],
    tech: ['Azure Machine Learning', 'Azure AI Search', 'Azure OpenAI'],
    platforms: ['azure-iot-hub', 'ibm-maximo', 'pdfs-and-scanned-documents'],
    flow: ['Flight & maintenance data', 'Risk models', 'Manuals index', 'Technician assistant'],
    maturity: 'poc', reuse: 55, weeks: 8,
  },
  {
    slug: 'student-insights-assistant', title: 'Student Insights Assistant', industry: 'education',
    tagline: 'Early-warning insights and instant reports for faculty and student success teams.',
    client: 'University', region: 'India',
    problem: 'Attendance, grades and LMS activity lived in separate systems, so at-risk students were spotted late.',
    solution: 'Data from the SIS and LMS is unified in Fabric; a model flags at-risk students and faculty ask an assistant for cohort reports in plain English.',
    impact: 'Earlier interventions and no manual report building.',
    metrics: [{ label: 'Report preparation', value: '-90%' }],
    features: ['At-risk flags', 'Plain-English cohort reports', 'Advisor action items'],
    tech: ['Microsoft Fabric', 'Azure OpenAI', 'Power BI'],
    platforms: ['microsoft-fabric', 'sql-server', 'excel-and-csv-files'],
    flow: ['SIS & LMS', 'Fabric Lakehouse', 'Risk model', 'Faculty assistant'],
    maturity: 'pilot', reuse: 70, weeks: 4,
  },
];

const projects: Project[] = sp.map((s, i) => ({
  id: s.slug,
  slug: s.slug,
  title: s.title,
  tagline: s.tagline,
  industryId: s.industry,
  extraIndustryIds: s.extra ?? [],
  clientName: s.client,
  clientDisplay: s.client,
  region: s.region,
  problem: s.problem,
  solution: s.solution,
  impact: s.impact,
  metrics: s.metrics,
  features: s.features,
  techStack: s.tech,
  platformIds: s.platforms,
  architecture: {
    flow: s.flow.map((f) => (typeof f === 'string' ? { title: f } : f)),
    description: `Data flows from ${s.flow[0]} through ${s.flow.slice(1, -1).join(', ')} to ${s.flow[s.flow.length - 1]}.`,
  },
  media: { screenshots: [] },
  maturity: s.maturity,
  reuseScore: s.reuse,
  weeksToDeploy: s.weeks,
  visibility: s.visibility ?? 'public',
  status: 'published',
  featured: !!s.featured,
  isSample: true,
  createdAt: T0,
  updatedAt: T0,
  publishedAt: new Date(Date.parse(T0) + i * 86400000).toISOString(),
}));

// ─── Posts ──────────────────────────────────────────────────────────────────
const posts: Post[] = [
  {
    id: 'bring-ai-to-your-data', type: 'blog', slug: 'bring-ai-to-your-data',
    title: 'Bring the AI to your data — not your data to the AI',
    excerpt: 'Why we put an AI layer on the systems you already run instead of starting another data migration.',
    body: `Most AI projects stall in the same place: *"First we need to move the data."*\n\nWe take the opposite approach. Your data could be in SQL Server, Oracle, SAP, Dynamics 365, Salesforce, ServiceNow or a SharePoint library — we connect to it where it lives.\n\n## The pattern\n\n1. **Connect** — mirroring, shortcuts or APIs, never a big-bang migration.\n2. **Unify** — a governed semantic layer in Microsoft Fabric.\n3. **Reason** — agents in Azure AI Foundry or Copilot Studio that understand your business terms.\n4. **Act** — answers, reports and action items in Teams, email and your line-of-business apps.\n\n## Why it works\n\n- Security and permissions stay where they already are.\n- Value shows up in weeks, not quarters.\n- Every agent is built from a tested template, so we only customise what is unique to you.\n\n> Don't build from scratch. Start with ready-to-deploy AI agents.`,
    tags: ['AI agents', 'Microsoft Fabric', 'Strategy'], author: 'UBTI AI Team', projectIds: ['any-data-qa-agent'],
    status: 'published', publishedAt: '2026-10-02T09:00:00.000Z', createdAt: T0, updatedAt: T0,
  },
  {
    id: 'templates-not-from-scratch', type: 'blog', slug: 'start-with-a-template',
    title: 'Skip the months of development: start with a template',
    excerpt: 'How our library of industry agents turns a six-month build into a four-week deployment.',
    body: `Every industry has a handful of problems that look the same from client to client: invoices to read, contracts to review, sales to explain, assets to maintain.\n\nWe have built those agents many times. Each template in the Atlas includes the architecture, prompts, evaluation set and deployment scripts.\n\n## What changes per client\n\n- Connectors to *your* systems\n- Your vocabulary and business rules\n- Your approval workflow\n\n## What doesn't\n\n- The tested pipeline\n- Guardrails and evaluation\n- Monitoring and cost controls\n\nThe **reuse score** on each project page tells you how much carries over.`,
    tags: ['Templates', 'Delivery'], author: 'UBTI AI Team', projectIds: [],
    status: 'published', publishedAt: '2026-10-20T09:00:00.000Z', createdAt: T0, updatedAt: T0,
  },
  {
    id: 'vision-reads-architecture', type: 'blog', slug: 'reading-architecture-diagrams-with-vision',
    title: 'Letting a vision model read our architecture diagrams',
    excerpt: 'How the Atlas turns an architecture slide into a flow description and tech-stack tags — and where it still needs a human.',
    body: `When an engineer uploads a pitch deck to the Atlas, the admin picks the slide with the architecture diagram. A vision-capable model reads it and proposes:\n\n- the **flow** — the steps data takes from source to outcome\n- the **tech stack** — services and platforms it recognises\n\nA human always reviews the draft before it is published. Diagrams drawn as native PowerPoint shapes are exported as a screenshot first.`,
    tags: ['Vision', 'Engineering'], author: 'UBTI AI Team', projectIds: [],
    status: 'published', publishedAt: '2026-11-05T09:00:00.000Z', createdAt: T0, updatedAt: T0,
  },
  {
    id: 'cs-freight-documents', type: 'case-study', slug: 'freight-forwarder-touchless-invoices',
    title: 'How a freight forwarder made 78% of carrier invoices touchless',
    excerpt: 'Document AI and a rate-card audit replaced manual keying for thousands of invoices a month.',
    clientDisplay: 'Freight forwarder, India', industryId: 'logistics', projectIds: ['freight-document-ai'],
    results: [{ label: 'Touchless invoices', value: '78%' }, { label: 'Overcharges caught', value: '3.1%' }, { label: 'Go-live', value: '3 weeks' }],
    body: `## The challenge\n\nCarrier invoices arrived in dozens of layouts. The finance team keyed every line manually and had no time to check charges against contracted rates.\n\n## What we built\n\nWe deployed our **Freight Invoice & Document AI** template on the client\'s shared mailboxes and ERP. Every invoice is read, matched to its shipment and audited against the rate card.\n\n## Results\n\nMost invoices now post with no human touch, and the exception queue explains every mismatch.`,
    tags: ['Document AI', 'Logistics'], author: 'UBTI AI Team',
    status: 'published', publishedAt: '2026-09-15T09:00:00.000Z', createdAt: T0, updatedAt: T0,
  },
  {
    id: 'cs-peer-risk', type: 'case-study', slug: 'erm-peer-benchmarking-in-an-afternoon',
    title: 'ERM peer benchmarking in an afternoon instead of weeks',
    excerpt: 'A Copilot Studio agent that reads peer 10-K filings and surfaces new and escalated risks.',
    clientDisplay: 'Global risk & insurance advisory', industryId: 'financial-services', projectIds: ['10k-peer-risk-analyzer'],
    results: [{ label: 'Effort saved', value: '85%' }, { label: 'Peers compared', value: '25' }],
    body: `## The challenge\n\nAnalysts manually compared risk-factor sections across peer annual reports every year.\n\n## What we built\n\nA Copilot Studio agent that extracts, classifies and diffs risk factors year over year, with chat and export.\n\n## Results\n\nBenchmarking that took weeks now takes an afternoon, and analysts spend their time on judgement.`,
    tags: ['Copilot Studio', 'Risk'], author: 'UBTI AI Team',
    status: 'published', publishedAt: '2026-10-28T09:00:00.000Z', createdAt: T0, updatedAt: T0,
  },
].map((p) => ({ ...p, isSample: true })) as Post[];

// ─── Company ────────────────────────────────────────────────────────────────
export const company: CompanySettings = {
  id: 'main',
  name: 'UBTI',
  productName: 'UBTI AI Atlas',
  tagline: 'Your data could be anywhere. We bring the AI to it.',
  subTagline:
    'From Shipping and Automotive to Healthcare, Financial Services, Aerospace, Education, Manufacturing, Insurance, Oil & Gas and Real Estate — UBTI offers pre-built, industry-specific AI agents designed around real business needs.',
  pitchLine: "Don't build from scratch. Start with ready-to-deploy AI agents.",
  about:
    'UBTI is a **Microsoft Solutions Partner** building AI agents, Q&A, reports and action items on any data source — wherever it lives.\n\nOur AI team accelerates AI adoption with proven templates, customisable workflows and intelligent automation, tailored to each client\'s business requirements. We work across Microsoft Fabric, Azure AI Foundry, Copilot Studio and the systems our clients already run.\n\n*Edit this text in Admin → Company.*',
  stats: [
    { label: 'Weeks to first agent in production', value: '2–6' },
    { label: 'Template reuse on new engagements', value: 'up to 90%' },
  ],
  capabilities: ['AI agents & copilots', 'Voice agents', 'RAG & document AI', 'Microsoft Fabric data platforms', 'Power Automate & RPA', 'Copilot Studio', 'Azure AI Foundry', 'Predictive analytics'],
  partnerLine: 'Microsoft Solutions Partner',
  contactEmail: '',
  website: 'https://ubtiinc.com',
  offices: ['Chennai, India'],
};

export function buildSeed() {
  return {
    industries: industries.map((x) => ({ ...x, isSample: false })),
    platforms,
    certifications,
    projects,
    posts,
    company: [company],
    pitches: [],
    pitchEvents: [],
    leads: [],
    users: [],
  };
}
