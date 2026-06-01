/**
 * Seed knowledge base with initial data.
 * Usage: node db/seed-knowledge.js
 * Safe to re-run — uses ON CONFLICT DO NOTHING (won't overwrite edits).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db');

const COMPANY_PROFILE = {
  sections: [
    {
      id: 'about_adani',
      title: 'About Adani',
      subsections: [
        {
          id: 'history',
          title: 'History and Background',
          type: 'text',
          content:
            'Adani Group was founded in 1988 by Gautam Adani, beginning as a commodity trading business in Ahmedabad, Gujarat. Over three decades it has evolved into one of India\'s largest and most diversified conglomerates, spanning 7 major business verticals with a market capitalisation exceeding ₹12 Lakh Crore. Headquartered at Shantigram, Ahmedabad, the Group operates in over 50 countries and is listed across multiple publicly traded entities on Indian stock exchanges. Its vision of "Growth with Goodness" underpins a commitment to nation-building, sustainable infrastructure, and strategic self-reliance.',
        },
        {
          id: 'major_sectors',
          title: 'Major Business Sectors',
          type: 'list',
          items: [
            'Ports & Logistics',
            'Energy & Utilities (Renewable + Thermal)',
            'Infrastructure & Airports',
            'Resources & Commodities',
            'Defence & Aerospace',
            'Real Estate & Smart Cities',
            'Financial Services & Media',
          ],
        },
      ],
    },
    {
      id: 'business_sectors',
      title: 'Business Sectors',
      subsections: [
        {
          id: 'ports',
          title: 'Ports and Logistics',
          type: 'text',
          content:
            "Adani Ports & SEZ (APSEZ) is India's largest private multi-port operator and among the world's top port operators. It manages 13 strategically located ports and terminals across India's coastline, handling over 400 MMT of cargo annually. The company is expanding globally with acquisitions in Israel (Haifa Port), Sri Lanka, Tanzania, and Australia — anchoring India's trade corridors.",
        },
        {
          id: 'energy',
          title: 'Energy and Utilities',
          type: 'text',
          content:
            "Adani Group is India's largest private power generation and distribution company. With 26,000+ MW of generation capacity and a bold target to become the world's largest renewable energy company by 2030, it is driving India's clean energy transition. Key entities include Adani Green Energy (solar & wind), Adani Power (thermal), and Adani Total Gas (city gas distribution).",
        },
        {
          id: 'airports',
          title: 'Infrastructure and Airports',
          type: 'text',
          content:
            'Adani Airport Holdings operates 8 airports across India — Ahmedabad, Mumbai (CSIA), Lucknow, Mangaluru, Jaipur, Guwahati, Thiruvananthapuram, and Navi Mumbai (under development) — making it the country\'s largest airport operator by passenger traffic with a combined capacity exceeding 180 million passengers annually.',
        },
        {
          id: 'resources',
          title: 'Resources and Commodities',
          type: 'text',
          content:
            "Adani Enterprises and Adani Wilmar manage integrated resources across coal, edible oil, food products, and agri commodities. The Carmichael Mine in Queensland, Australia, is one of the world's largest thermal coal operations. The commodities vertical ensures energy security and food supply chain resilience critical to India's strategic autonomy.",
        },
        {
          id: 'defence',
          title: 'Defence and Aerospace',
          type: 'text',
          content:
            "Adani Defence & Aerospace (AD&A) is a strategic business unit aligned with the Atmanirbhar Bharat initiative, building India's indigenous defence production capability. Key global partnerships include Elbit Systems (Israel), EDGE Group (UAE), Thales (France), and Rheinmetall (Germany). The AEW&C Mk-II programme — a flagship national security programme — is developing airborne early warning and control systems for the Indian Air Force in collaboration with DRDO and HAL.",
        },
      ],
    },
    {
      id: 'benefits',
      title: 'Defence & Aerospace Employee Benefits (ONLY for Adani Payroll)',
      subsections: [
        {
          id: 'compensation',
          title: 'Compensation & Incentives',
          type: 'list',
          items: [
            'Competitive market-linked CTC with structured annual increments',
            'Performance-linked variable pay: 10–25% of CTC depending on grade',
            'Joining bonus for critical / niche-skill roles',
            'Retention bonus for long-tenure employees on classified programmes',
          ],
        },
        {
          id: 'health',
          title: 'Health & Wellness',
          type: 'list',
          items: [
            'Comprehensive medical insurance: Employee + Spouse + 2 Children + Parents',
            'Top-up insurance available at subsidised group rates',
            '24×7 Employee Assistance Programme (mental health support)',
            'Annual health check-up for employee and spouse',
          ],
        },
        {
          id: 'lifestyle',
          title: 'Lifestyle & Convenience',
          type: 'list',
          items: [
            'Company-facilitated accommodation or HRA for outstation hires',
            'Transportation facility for site-based employees (Hyderabad, Kanpur, Gwalior)',
            'Subsidised cafeteria at all campuses',
            'Fuel and vehicle maintenance reimbursement for senior grades',
          ],
        },
        {
          id: 'growth',
          title: 'Career & Growth',
          type: 'list',
          items: [
            'Access to Adani University and internal L&D platforms',
            'Sponsored certifications and domain-specific technical training',
            'Overseas exposure through OEM partner visits (Elbit, Thales, Rheinmetall)',
            'Fast-track annual promotion cycle for high performers',
            'Cross-functional mobility across Adani Group verticals',
          ],
        },
      ],
    },
    {
      id: 'sell_points',
      title: 'Typical Candidate Sell Points',
      subsections: [
        {
          id: 'programme',
          title: 'Programme Significance',
          type: 'list',
          items: [
            'Flagship national security programme — AEW&C Mk-II is one of India\'s most strategic defence projects',
            'Working directly with DRDO scientists and HAL engineers on classified technology',
            'Direct contribution to Atmanirbhar Bharat — reducing India\'s defence import dependency',
            'Career-defining work that very few engineers in India ever get to do',
          ],
        },
        {
          id: 'stability',
          title: 'Stability & Scale',
          type: 'list',
          items: [
            'Adani Group is a ₹12 Lakh Crore conglomerate — unparalleled financial stability',
            'Government-backed programme with multi-year funding visibility',
            'No-layoff culture on strategic defence programmes',
            'Large, structured team environment with formal HR processes unlike startup environments',
          ],
        },
        {
          id: 'global',
          title: 'Global Exposure',
          type: 'list',
          items: [
            'Partnership with world-class OEMs: Elbit Systems, Thales, EDGE Group, Rheinmetall',
            'International travel and training at OEM facilities abroad',
            'Exposure to NATO-grade systems, methodologies, and engineering standards',
            'Joint development programmes with global technology leaders',
          ],
        },
      ],
    },
    {
      id: 'success_profile',
      title: 'Success Profile',
      subsections: [
        {
          id: 'academic',
          title: 'Academic Background',
          type: 'list',
          items: [
            'B.Tech / M.Tech / ME from IIT, NIT, BITS, or equivalent Tier-1 institutions',
            'DIAT (Defence Institute of Advanced Technology) alumni preferred for senior roles',
            'GATE-qualified candidates preferred for fresh engineering roles',
            'M.Sc (Electronics / Physics) accepted for specific signal processing and EW roles',
          ],
        },
        {
          id: 'experience',
          title: 'Experience Profile',
          type: 'list',
          items: [
            'Prior exposure to DRDO, DPSUs (HAL, BEL, BDL, BEML) or private defence OEMs strongly preferred',
            '3–15 years of experience depending on role band',
            'Programme management experience valuable for senior and lead roles',
            'Systems engineering or MBSE experience preferred for architecture roles',
          ],
        },
        {
          id: 'traits',
          title: 'Behavioural Traits',
          type: 'list',
          items: [
            'Security clearance eligible — Indian nationals only, no dual citizenship',
            'High adaptability — programme timelines and priorities can shift rapidly',
            'Strong documentation and process discipline (DO-178C, AS9100 awareness a plus)',
            'Collaborative mindset — large cross-functional multi-org team environment',
            'Long-term orientation — not looking for a 2-year stint',
          ],
        },
      ],
    },
  ],
};

const LOCATIONS = {
  locations: [
    {
      id: 'ahmedabad',
      name: 'Ahmedabad',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Ahmedabad is the largest city in Gujarat and India's commercial capital of the west. It is the headquarters of the Adani Group, hosting the Group HQ at Shantigram along with Defence & Aerospace leadership and several shared services functions. The city is one of India's fastest-growing metros with a thriving industrial and technology ecosystem, strong industrial culture, and excellent infrastructure.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            'Adani Group HQ — proximity to top leadership and strategic decision-making',
            'Rapidly developing city: GIFT City, Metro rail, world-class new airport',
            'Significantly lower cost of living vs Mumbai or Delhi NCR',
            'Strong Gujarati business community — excellent for entrepreneurial-minded candidates',
            'Excellent connectivity: direct flights to all major Indian metros and international hubs',
            'Vibrant cultural scene: heritage, food, and growing cosmopolitan identity',
          ],
        },
      ],
    },
    {
      id: 'delhi',
      name: 'Delhi / NCR',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Delhi NCR is India's political and administrative capital and the hub for defence procurement, policy, and government engagement. Adani Defence & Aerospace maintains a presence here for BD and government liaison functions. Key defence bodies in the vicinity include MoD, DRDO HQ, OFB, DDP, and all armed forces headquarters.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            'India\'s political capital — ideal for senior BD and policy engagement roles',
            'Strongest defence ecosystem: DRDO, MoD, DDP, PSU headquarters all nearby',
            'Largest talent pool for BD, government liaison, and corporate roles',
            'World-class infrastructure and connectivity (IGI — one of Asia\'s busiest airports)',
            'Premium residential options in Gurugram, Noida, and Greater Noida',
            'Established and active community of defence and aerospace professionals',
          ],
        },
      ],
    },
    {
      id: 'hyderabad',
      name: 'Hyderabad',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Hyderabad is India's premier aerospace and electronics defence hub. HAL's aircraft manufacturing division, DRDO's DRDL and DLRL labs, BDL, BEL, and numerous private defence companies are based here. Adani's Hyderabad operations focus on electronics, avionics, and systems integration for the AEW&C Mk-II and related programmes. The city also hosts a massive IT talent pool with defence-relevant dual-use expertise.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            "India's premier aerospace city: HAL, BEL, BDL, DRDL, DLRL, NRSC, ADE all headquartered here",
            'Second-lowest cost of living among major Indian metros',
            'Vibrant IT and dual-use defence technology ecosystem',
            'Direct access to avionics and electronics talent from local PSUs and defence labs',
            'Well-connected with the new ORR expressway and Rajiv Gandhi International Airport',
            'Strong peer community for defence and aerospace engineers',
          ],
        },
      ],
    },
    {
      id: 'kanpur',
      name: 'Kanpur',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Kanpur hosts DMSRDE (Defence Materials & Stores R&D Establishment), DRDO's propellant and ammunition labs, and Ordnance Factory Board production facilities. Adani's ammunition and propellant manufacturing operations have a significant presence in Kanpur, catering to small arms and artillery domains under the Defence & Aerospace BU.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            'IIT Kanpur nearby — strong academic, research, and engineering talent ecosystem',
            'DRDO propellant and ammunition labs in the vicinity: excellent peer community',
            'Ordnance Factory tradition — deep pool of experienced manufacturing professionals',
            'Very low cost of living — high purchasing power compared to metro cities',
            'Improving infrastructure: Purvanchal Expressway and upcoming metro connectivity',
          ],
        },
      ],
    },
    {
      id: 'gwalior',
      name: 'Gwalior',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Gwalior is a significant military and defence manufacturing hub in Madhya Pradesh. The city is home to IAF training establishments and several ordnance production facilities. Adani's Gwalior operations focus on small arms manufacturing and MRO activities, drawing on the established defence manufacturing heritage of the region.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            'Strategic IAF base city — strong military culture and professional community',
            'Ordnance Factory Gwalior (OFG) nearby — experienced manufacturing talent',
            'Peaceful, well-planned city with a very low cost of living',
            'Rich historical heritage: Gwalior Fort, music traditions, cultural identity',
            'Growing connectivity with new infrastructure investments under Madhya Pradesh growth plan',
          ],
        },
      ],
    },
    {
      id: 'bangalore',
      name: 'Bangalore',
      sections: [
        {
          id: 'about',
          title: 'About the Location',
          type: 'text',
          content:
            "Bengaluru is India's technology capital and the heartland of Indian aerospace. HAL's main manufacturing facility, ADE (Aeronautical Development Establishment), CEMILAC, CABS, NAL, and ISRO are all located here. The city is central to the LCA Tejas programme, military helicopter development, and several UAV/UAS development initiatives. Adani's systems integration and fixed-wing UAV work draws heavily on Bengaluru's unmatched talent ecosystem.",
        },
        {
          id: 'pitch',
          title: 'Candidate Pitch Points',
          type: 'list',
          items: [
            'India\'s aerospace heartland: HAL, ADE, CABS, NAL, CEMILAC, ISRO — all here',
            "India's deepest pool of aerospace engineering talent",
            'Thriving startup ecosystem offering exposure to dual-use and deep-tech',
            "Pleasant year-round weather — consistently India's most liveable large city",
            'World-class international connectivity and global MNC presence',
            'Largest and most active professional network for aerospace and defence engineers in India',
          ],
        },
      ],
    },
  ],
};

const DOMAIN_MATRIX = {
  columns: ['Domain', 'Leader', 'BD', 'Ops', 'Products', 'Manpower Forecast', 'Product Description'],
  rows: [
    { id: 'r1',  Domain: 'AWACS (Airborne Systems)',            Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Airborne Early Warning & Control platform for IAF — AEW&C Mk-II Programme' },
    { id: 'r2',  Domain: 'CDS',                                Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Command & Control / Data Link Systems' },
    { id: 'r3',  Domain: 'Ammunition',                         Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Conventional and smart ammunition including artillery and infantry rounds' },
    { id: 'r4',  Domain: 'Loitering Munition (LM)',            Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Kamikaze-type loitering munitions for precision strike capability' },
    { id: 'r5',  Domain: 'Kamikaze Drones',                    Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Expendable drone systems for one-way attack missions' },
    { id: 'r6',  Domain: 'Missile (DRDO) / DCPP (Non-DRDO)',   Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Guided missile systems under DRDO co-development and private DCPP track' },
    { id: 'r7',  Domain: 'Small Arms',                         Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Infantry weapons: rifles, carbines, LMGs, and associated ammunition' },
    { id: 'r8',  Domain: 'Artillery Guns',                     Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Towed and self-propelled artillery systems' },
    { id: 'r9',  Domain: 'Rotary Wing',                        Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Helicopter platforms, upgrades, and mission systems' },
    { id: 'r10', Domain: 'Fixed Wing UAV',                     Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'MALE/HALE category fixed-wing unmanned aerial vehicles' },
    { id: 'r11', Domain: 'Unmanned Systems',                   Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Ground and maritime unmanned systems including UGV and USV platforms' },
    { id: 'r12', Domain: 'MRO',                                Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Maintenance, Repair and Overhaul services for aircraft and defence equipment' },
    { id: 'r13', Domain: 'MGS (Mounted Gun System)',            Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Vehicle-mounted artillery/gun systems for rapid deployment' },
    { id: 'r14', Domain: 'NSG (Naval Surface Guns)',            Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Ship-mounted naval gun systems' },
    { id: 'r15', Domain: 'Propellant MIL',                     Leader: '', BD: '', Ops: '', Products: '', 'Manpower Forecast': '', 'Product Description': 'Military-grade propellants and energetic materials' },
  ],
};

const BU_PLANNING = {
  bus: [
    {
      id: 'bu1',
      title: 'BU Head | Product (Small Arms & Missiles)',
      leader: 'AVM Raju',
      specialization: 'Mech / Electronic Design / Explosives / Air Frame',
      years: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
      dimensions: [
        'BU Overview',
        'Products',
        'Journey from Today to 5YP',
        'Capability Gaps',
        'Key Skills to be Hired',
        'Where to Hire From / Not to Hire From',
        'Assessments',
        'HC Now & Later',
      ],
      data: {
        'BU Overview':                          { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Products':                             { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Journey from Today to 5YP':            { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Capability Gaps':                      { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Key Skills to be Hired':               { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Where to Hire From / Not to Hire From':{ Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Assessments':                          { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'HC Now & Later':                       { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
      },
    },
    {
      id: 'bu2',
      title: 'BU Head | Product (ISR)',
      leader: '',
      specialization: 'Intelligence, Surveillance & Reconnaissance Systems',
      years: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
      dimensions: [
        'BU Overview',
        'Products',
        'Journey from Today to 5YP',
        'Capability Gaps',
        'Key Skills to be Hired',
        'Where to Hire From / Not to Hire From',
        'Assessments',
        'HC Now & Later',
      ],
      data: {
        'BU Overview':                          { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Products':                             { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Journey from Today to 5YP':            { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Capability Gaps':                      { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Key Skills to be Hired':               { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Where to Hire From / Not to Hire From':{ Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'Assessments':                          { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
        'HC Now & Later':                       { Y1: '', Y2: '', Y3: '', Y4: '', Y5: '' },
      },
    },
  ],
};

async function seedKnowledge() {
  const client = await pool.connect();
  try {
    console.log('▶ Ensuring knowledge_base table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id         SERIAL PRIMARY KEY,
        section    VARCHAR(100) UNIQUE NOT NULL,
        data       JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const sections = [
      { key: 'company_profile', data: COMPANY_PROFILE },
      { key: 'locations',       data: LOCATIONS },
      { key: 'domain_matrix',   data: DOMAIN_MATRIX },
      { key: 'bu_planning',     data: BU_PLANNING },
    ];

    for (const { key, data } of sections) {
      console.log(`▶ Seeding knowledge section: ${key}...`);
      await client.query(`
        INSERT INTO knowledge_base (section, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (section) DO NOTHING
      `, [key, JSON.stringify(data)]);
    }

    console.log('✅ Knowledge base seeding complete.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedKnowledge();
