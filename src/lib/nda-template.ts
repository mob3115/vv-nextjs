// ============================================================
// Mutual Non-Disclosure Agreement — boilerplate template
//
// This is a general-purpose template for early-stage, pre-transaction
// M&A discussions (a prospective buyer and seller exchanging enough
// information to evaluate a possible acquisition). It is NOT legal
// advice and has not been reviewed by an attorney for any specific
// jurisdiction or deal. Bump NDA_TEMPLATE_VERSION any time the section
// text changes below — every signature records the version it was
// shown, so a later edit here never rewrites what a past signer agreed to.
// ============================================================

export const NDA_TEMPLATE_VERSION = '2026-09-v1'

// Filled in by whoever operates this platform, ideally with counsel's
// input — left as an explicit placeholder rather than guessed.
export const DEFAULT_GOVERNING_LAW = '[Governing State/Jurisdiction — to be specified]'

export const NDA_DISCLAIMER =
  'This is a boilerplate template provided for convenience and does not ' +
  'constitute legal advice. V+V Marketplace makes no representation that ' +
  'this agreement is suitable for any particular transaction or ' +
  'jurisdiction. Both parties are encouraged to have this agreement ' +
  'reviewed by independent legal counsel before signing, and especially ' +
  'before exchanging highly sensitive financial, proprietary, or personal ' +
  'information.'

export interface NdaTemplateVars {
  buyerName: string
  sellerName: string
  industry: string
  locationRegion: string
  effectiveDate: string // human-readable, e.g. "September 9, 2026"
  governingLaw?: string
}

export interface NdaSection {
  id: string
  heading: string
  body: string[] // paragraphs; may contain {{placeholders}}
}

export const NDA_SECTIONS: NdaSection[] = [
  {
    id: 'parties',
    heading: '1. Parties and Effective Date',
    body: [
      'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of {{effectiveDate}} ' +
      '(the "Effective Date") by and between {{buyerName}} ("Buyer") and {{sellerName}} ("Seller," ' +
      'and together with Buyer, the "Parties," and each individually a "Party").',
      'The Parties were introduced through V+V Marketplace (the "Platform"), a marketplace that ' +
      'facilitates introductions between prospective business buyers and sellers. The Platform is ' +
      'not a party to this Agreement, is not a broker, agent, or representative of either Party, and ' +
      'assumes no liability for either Party’s compliance with its terms.',
    ],
  },
  {
    id: 'purpose',
    heading: '2. Purpose',
    body: [
      'The Parties wish to explore a possible negotiated transaction involving the potential ' +
      'acquisition of, investment in, or other business combination with a business identified ' +
      'through the Platform in the {{industry}} industry, located in or around {{locationRegion}} ' +
      '(the "Opportunity"). In connection with evaluating the Opportunity, each Party may disclose ' +
      'to the other certain non-public, confidential, and/or proprietary information. This Agreement ' +
      'sets out the terms on which that information will be protected.',
    ],
  },
  {
    id: 'definition',
    heading: '3. Definition of Confidential Information',
    body: [
      '"Confidential Information" means any information disclosed by either Party (the "Disclosing ' +
      'Party") to the other (the "Receiving Party"), whether disclosed orally, in writing, ' +
      'electronically, or by any other means, and whether or not marked as "confidential," that a ' +
      'reasonable person would understand to be confidential or proprietary given the nature of the ' +
      'information and the circumstances of disclosure. This includes, without limitation: financial ' +
      'statements, revenue, margins, and pricing; customer, supplier, and vendor lists and ' +
      'relationships; business plans, forecasts, and strategy; trade secrets, know-how, and ' +
      'proprietary processes; employee and personnel information; the existence, status, and terms of ' +
      'discussions regarding the Opportunity; and any analyses, summaries, or notes prepared by the ' +
      'Receiving Party that are based on or reflect any of the foregoing.',
    ],
  },
  {
    id: 'exclusions',
    heading: '4. Exclusions from Confidential Information',
    body: [
      'Confidential Information does not include information that: (a) is or becomes publicly ' +
      'available through no fault of the Receiving Party; (b) was already lawfully in the Receiving ' +
      'Party’s possession without a duty of confidentiality prior to disclosure; (c) is lawfully ' +
      'obtained from a third party without breach of any obligation of confidentiality; or ' +
      '(d) is independently developed by the Receiving Party without use of or reference to the ' +
      'Disclosing Party’s Confidential Information.',
    ],
  },
  {
    id: 'obligations',
    heading: '5. Obligations of the Receiving Party',
    body: [
      'The Receiving Party agrees to: (a) hold the Disclosing Party’s Confidential Information in ' +
      'strict confidence and use at least the same degree of care it uses to protect its own ' +
      'confidential information of similar importance, and in no event less than a reasonable degree ' +
      'of care; (b) use Confidential Information solely to evaluate, negotiate, and/or pursue the ' +
      'Opportunity, and for no other purpose; (c) not disclose Confidential Information to any third ' +
      'party except as expressly permitted below; and (d) not use Confidential Information to compete ' +
      'with, disadvantage, or circumvent the Disclosing Party.',
    ],
  },
  {
    id: 'permitted-disclosures',
    heading: '6. Permitted Disclosures',
    body: [
      'The Receiving Party may disclose Confidential Information to its officers, employees, ' +
      'partners, financing sources, and professional advisors (including attorneys, accountants, and ' +
      'consultants) who have a genuine need to know it in connection with the Opportunity, provided ' +
      'that each such person is informed of its confidential nature and is bound by confidentiality ' +
      'obligations at least as protective as those in this Agreement. The Receiving Party remains ' +
      'responsible for any breach of this Agreement by such persons.',
      'A Party may also disclose Confidential Information to the extent required by law, regulation, ' +
      'or valid legal process, provided that, where legally permitted, it gives the Disclosing Party ' +
      'prompt written notice before doing so and reasonably cooperates (at the Disclosing Party’s ' +
      'expense) with any effort to seek confidential treatment or a protective order.',
    ],
  },
  {
    id: 'no-obligation',
    heading: '7. No Obligation to Transact; No Representations or Warranties',
    body: [
      'Nothing in this Agreement obligates either Party to proceed with, negotiate, or complete the ' +
      'Opportunity, and either Party may terminate discussions at any time, for any reason, without ' +
      'liability (other than as expressly set out in this Agreement). Neither Party makes any ' +
      'representation or warranty, express or implied, as to the accuracy or completeness of any ' +
      'Confidential Information disclosed, and neither Party shall have any liability to the other ' +
      'arising from the use of, or reliance on, Confidential Information disclosed under this ' +
      'Agreement, except as may separately be agreed in a definitive transaction agreement.',
    ],
  },
  {
    id: 'non-circumvention',
    heading: '8. Non-Solicitation and Non-Circumvention',
    body: [
      'For a period of twelve (12) months following the Effective Date, the Receiving Party agrees ' +
      'not to, directly or indirectly: (a) solicit for employment any employee of the Disclosing Party ' +
      'with whom it had contact in connection with the Opportunity (other than through general ' +
      'public advertising not targeted at such employees); or (b) use Confidential Information to ' +
      'contact, solicit, or transact with any customer, supplier, lender, investor, or other business ' +
      'relationship of the Disclosing Party identified through the Opportunity, for the purpose of ' +
      'circumventing the Disclosing Party or this Agreement.',
    ],
  },
  {
    id: 'term',
    heading: '9. Term and Survival',
    body: [
      'This Agreement is effective as of the Effective Date and continues until terminated by either ' +
      'Party on written notice to the other. The confidentiality obligations in Sections 3–6 of ' +
      'this Agreement survive termination and remain in effect for two (2) years from the date any ' +
      'particular item of Confidential Information was disclosed, except for information that ' +
      'constitutes a trade secret under applicable law, which shall remain protected for as long as ' +
      'it retains trade secret status.',
    ],
  },
  {
    id: 'return',
    heading: '10. Return or Destruction of Materials',
    body: [
      'Upon the Disclosing Party’s written request, or upon termination of discussions regarding ' +
      'the Opportunity, the Receiving Party will promptly return or destroy all documents and other ' +
      'tangible materials containing Confidential Information and permanently delete any electronic ' +
      'copies in its possession or control, except that the Receiving Party may retain one copy where ' +
      'required by law, regulation, or a bona fide document retention policy, subject to the ' +
      'continuing confidentiality obligations of this Agreement.',
    ],
  },
  {
    id: 'remedies',
    heading: '11. Remedies',
    body: [
      'Each Party acknowledges that unauthorized disclosure or use of Confidential Information may ' +
      'cause irreparable harm for which monetary damages alone would be an inadequate remedy, and ' +
      'that the Disclosing Party shall be entitled to seek injunctive or other equitable relief, in ' +
      'addition to any other remedies available at law or in equity, without the necessity of posting ' +
      'a bond.',
    ],
  },
  {
    id: 'esign',
    heading: '12. Electronic Signatures',
    body: [
      'The Parties agree that this Agreement may be executed electronically, including by checking an ' +
      '"I Agree" acknowledgment and typing a name and/or initials into the Platform’s signing ' +
      'flow, and that such electronic execution shall have the same legal force and effect as a ' +
      'handwritten signature, to the fullest extent permitted by applicable law (including, in the ' +
      'United States, the federal E-SIGN Act and applicable state UETA statutes). The Platform ' +
      'records the signer’s identity, the date and time of signing, and the exact version of this ' +
      'Agreement presented at the time of signing.',
    ],
  },
  {
    id: 'misc',
    heading: '13. Miscellaneous',
    body: [
      'Governing Law. This Agreement is governed by the laws of {{governingLaw}}, without regard to ' +
      'its conflict-of-laws principles.',
      'Entire Agreement; Amendment. This Agreement constitutes the entire understanding between the ' +
      'Parties regarding its subject matter and supersedes all prior discussions on that subject. It ' +
      'may be amended only by a signed writing executed by both Parties.',
      'Assignment. Neither Party may assign this Agreement without the other Party’s prior ' +
      'written consent, except to a successor in connection with a merger, acquisition, or sale of ' +
      'substantially all of its assets.',
      'Severability. If any provision of this Agreement is held unenforceable, the remaining ' +
      'provisions will remain in full force and effect, and the unenforceable provision will be ' +
      'construed to reflect the Parties’ original intent as closely as possible.',
      'No Third-Party Beneficiaries. This Agreement is for the sole benefit of the Parties and confers ' +
      'no rights on the Platform or any other third party.',
      'Notices. Notices under this Agreement may be given through the Platform’s messaging system ' +
      'or to the email address associated with each Party’s Platform account.',
    ],
  },
]

function fillTemplate(text: string, vars: NdaTemplateVars): string {
  return text
    .replaceAll('{{buyerName}}', vars.buyerName)
    .replaceAll('{{sellerName}}', vars.sellerName)
    .replaceAll('{{industry}}', vars.industry)
    .replaceAll('{{locationRegion}}', vars.locationRegion)
    .replaceAll('{{effectiveDate}}', vars.effectiveDate)
    .replaceAll('{{governingLaw}}', vars.governingLaw ?? DEFAULT_GOVERNING_LAW)
}

export function renderNdaSections(vars: NdaTemplateVars) {
  return NDA_SECTIONS.map(section => ({
    ...section,
    body: section.body.map(p => fillTemplate(p, vars)),
  }))
}
