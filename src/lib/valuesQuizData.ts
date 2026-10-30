// Values Discovery Quiz — question banks and per-value blurbs for both audiences.
//
// Ported from the standalone reference quizzes (VV_Values_Quiz__Sellers.html /
// VV_Values_Quiz__Buyers.html). Option values are keyed directly by the exact
// CORE_VALUES label strings (src/lib/constants.ts) instead of the reference
// files' own slug ids — the two lists are an exact match (same 24 values, same
// wording, same order), so no id<->label translation layer is needed anywhere
// else in the app; a quiz result is already a valid `values: string[]`.

export type QuizQuestionType = 'rank' | 'pick'

export interface QuizOption {
  value: string // a CORE_VALUES label
  text: string
}

export interface QuizQuestion {
  id: string
  type: QuizQuestionType
  title: string
  setup: string
  options: QuizOption[]
}

export const sellerQuizQuestions: QuizQuestion[] = [
  { id: 's01', type: 'rank', title: 'Two finalists, one condition', setup: 'Two offers are nearly identical on price. You can add one condition to the deal before you sign.', options: [
    { value: 'Environmental Stewardship', text: 'They fund cleanup of the old storage lot by the river and keep the habitat buffer you planted.' },
    { value: 'Sustainability', text: 'They keep your sustainable sourcing and waste-reduction practices, even where cheaper suppliers exist.' },
    { value: 'Free Enterprise', text: 'No conditions. A clean deal. Once it’s theirs, they should be free to run it however they see fit.' },
    { value: 'Employee Wellbeing', text: 'They keep your team’s health plan and paid leave at current levels for at least two years.' },
  ]},
  { id: 's02', type: 'rank', title: 'What can’t be lost', setup: 'The buyer plans to modernize production. Rank what you most want preserved.', options: [
    { value: 'Craftsmanship', text: 'The hand-finished work your senior makers do, the part that takes years to learn.' },
    { value: 'Excellence & Quality', text: 'Your quality standards and inspection process, the reason returns are almost zero.' },
    { value: 'Creative Excellence', text: 'The distinctive design and creative voice that makes your products instantly recognizable.' },
    { value: 'Innovation & Discovery', text: 'The R&D budget and the freedom to keep experimenting with new products.' },
  ]},
  { id: 's03', type: 'rank', title: 'Pricing after the close', setup: 'The buyer tells you they plan to raise prices 20% and drop small accounts. Rank what concerns you most.', options: [
    { value: 'Customer Focused', text: 'How everyday customers will experience it: response times, service, how they feel walking in.' },
    { value: 'Client Stewardship', text: 'The long-standing key accounts you’ve personally looked after for years and are handing over.' },
    { value: 'Individual Responsibility', text: 'Honestly, nothing. It’s their business now, and they own the decision and the consequences.' },
    { value: 'Accessible to All', text: 'Small and lower-income customers who might get priced out entirely.' },
  ]},
  { id: 's04', type: 'rank', title: 'Choosing your exit path', setup: 'You have four realistic ways to step away. Rank them from most to least appealing.', options: [
    { value: 'Employee Ownership', text: 'Sell to your employees through an ESOP or co-op, even with a smaller or slower payout.' },
    { value: 'Family Values', text: 'Pass it to your daughter, who has worked here since she was 16, and keep it in the family.' },
    { value: 'Long Term Investment', text: 'Sell to a patient buyer who plans to hold it for 20+ years and reinvest the profits.' },
    { value: 'Economic Mobility', text: 'Sell to a buyer committed to hiring from the neighborhood and paying starting wages people can build savings on.' },
  ]},
  { id: 's05', type: 'pick', title: 'Lightning round', setup: 'Twenty years from now, someone describes your time running this business. Which sentence would you most want to hear?', options: [
    { value: 'Integrity', text: 'They never once went back on their word.' },
    { value: 'Free Enterprise', text: 'They built something from nothing, on their own terms.' },
    { value: 'Employee Wellbeing', text: 'People’s lives got better by working there.' },
    { value: 'Environmental Stewardship', text: 'They left the land and water better than they found it.' },
    { value: 'Craftsmanship', text: 'Everything they made was built to last.' },
    { value: 'Economic Mobility', text: 'People started there with nothing and moved up into real careers.' },
    { value: 'Client Stewardship', text: 'Clients trusted them with things that really mattered.' },
    { value: 'Family Values', text: 'It was a family business, and it felt like one.' },
  ]},
  { id: 's06', type: 'rank', title: 'Before you hand over the keys', setup: 'The deal leaves you a final pre-close budget and some leverage over the buyer. Rank where you’d use it.', options: [
    { value: 'Worker Safety', text: 'Replace the old press line that caused two near-miss injuries this year.' },
    { value: 'Equity', text: 'Correct the pay gaps an HR audit found between people doing similar work.' },
    { value: 'Conscious Capitalism', text: 'Get the buyer to adopt a stakeholder charter balancing profit with employees, community and suppliers.' },
    { value: 'Investing Local', text: 'Require the buyer to keep headquarters and key suppliers in the region.' },
  ]},
  { id: 's07', type: 'rank', title: 'Closing a location', setup: 'The buyer will close your second location, in a struggling neighborhood. Rank what matters most in how it’s handled.', options: [
    { value: 'Integrity', text: 'Telling everyone the truth early, even if it complicates the sale.' },
    { value: 'Workforce Development', text: 'Retraining the affected staff so they can land in better jobs.' },
    { value: 'Compassionate Care', text: 'Personal support for the people hit hardest: the single parent, the one nearing retirement.' },
    { value: 'Resident Dignity', text: 'Respecting the neighborhood: consulting residents and not leaving them a boarded-up building.' },
  ]},
  { id: 's08', type: 'rank', title: '10% more, with a catch', setup: 'The buyer offers 10% more if you’ll drop one commitment from the deal. Rank which you’d most refuse to drop.', options: [
    { value: 'Sustainability', text: 'Keeping your sustainable operating practices in place.' },
    { value: 'Craftsmanship', text: 'Keeping production in-house instead of moving it to a cheaper contract manufacturer.' },
    { value: 'Economic Mobility', text: 'Your commitment to hire from the neighborhood at starting wages people can build savings on.' },
    { value: 'Integrity', text: 'Fully disclosing a pending supplier dispute, even though it may lower the price.' },
  ]},
  { id: 's09', type: 'rank', title: 'Your transition year', setup: 'You’ll stay on for 12 months after the sale. Rank how you’d spend most of your time.', options: [
    { value: 'Environmental Stewardship', text: 'Finishing the energy and stormwater upgrades so the site’s footprint keeps shrinking.' },
    { value: 'Excellence & Quality', text: 'Locking in quality systems so standards don’t slip after you leave.' },
    { value: 'Workforce Development', text: 'Training the next generation of supervisors and tradespeople.' },
    { value: 'Family Values', text: 'Protecting the family-first culture: flexible schedules, kids at the summer picnic, people home for dinner.' },
  ]},
  { id: 's10', type: 'pick', title: 'Lightning round', setup: 'Which line from a buyer’s pitch would win you over?', options: [
    { value: 'Excellence & Quality', text: 'We won’t touch your standards. If anything, we’ll raise them.' },
    { value: 'Investing Local', text: 'We live here, we bank here, and we’ll keep every dollar we can in this region.' },
    { value: 'Employee Ownership', text: 'Within five years, every employee will own a piece of this company.' },
    { value: 'Accessible to All', text: 'We’ll make what you sell available to people who’ve never been able to afford it.' },
    { value: 'Conscious Capitalism', text: 'We measure success by what we do for employees, customers and community, and by profit.' },
    { value: 'Workforce Development', text: 'We’ll turn this place into a training ground for the region’s next skilled workforce.' },
    { value: 'Innovation & Discovery', text: 'We’re going to take what you built and invent the next version of it.' },
    { value: 'Long Term Investment', text: 'We’re not flippers. We plan to own this for a generation.' },
  ]},
  { id: 's11', type: 'rank', title: 'Shaping your earnout', setup: 'Part of your payout depends on post-sale targets, and you get to shape what’s measured. Rank what you’d tie it to.', options: [
    { value: 'Creative Excellence', text: 'The brand’s creative standing: design recognition, reviews, standout launches.' },
    { value: 'Client Stewardship', text: 'Keeping your top clients, and keeping them satisfied, through the transition.' },
    { value: 'Employee Ownership', text: 'Launching the employee equity plan on schedule.' },
    { value: 'Worker Safety', text: 'Zero lost-time injuries during the transition.' },
  ]},
  { id: 's12', type: 'rank', title: 'The buyer’s first 100 days', setup: 'The buyer shares their 100-day plan. Rank which part you’re most glad to see.', options: [
    { value: 'Innovation & Discovery', text: 'Launching a new product line using technology you never had the capital for.' },
    { value: 'Customer Focused', text: 'Overhauling service so customers get answers in hours, not days.' },
    { value: 'Resident Dignity', text: 'Partnering with the block club so neighbors have a real voice in expansion plans.' },
    { value: 'Investing Local', text: 'Moving purchasing to suppliers within 50 miles.' },
  ]},
  { id: 's13', type: 'rank', title: 'A community request', setup: 'A community group asks you to put conditions on the sale. Rank how you’d respond.', options: [
    { value: 'Free Enterprise', text: 'Let the market work. Putting conditions on a buyer isn’t my role.' },
    { value: 'Equity', text: 'Require a hiring and contracting plan that opens doors to people who’ve been shut out.' },
    { value: 'Accessible to All', text: 'Keep the sliding-scale pricing and the accessibility upgrades so anyone can be a customer.' },
    { value: 'Compassionate Care', text: 'Keep the hardship fund that helps employees through medical or family emergencies.' },
  ]},
  { id: 's14', type: 'rank', title: 'Advice on a napkin', setup: 'At the closing dinner, the new owner asks for your best advice. Rank what you’d write down.', options: [
    { value: 'Employee Wellbeing', text: 'Take care of your people first. Burnout costs more than overtime saves.' },
    { value: 'Individual Responsibility', text: 'Own your decisions. Nobody’s coming to bail you out, and that’s how it should be.' },
    { value: 'Conscious Capitalism', text: 'Profit is the fuel, not the destination.' },
    { value: 'Long Term Investment', text: 'Don’t run it for next quarter. Build it for the next decade.' },
  ]},
  { id: 's15', type: 'pick', title: 'Lightning round', setup: 'Which story about your business would make you proudest?', options: [
    { value: 'Sustainability', text: 'It ran for decades without burning out its people or its resources.' },
    { value: 'Equity', text: 'It gave real opportunity to people others overlooked.' },
    { value: 'Worker Safety', text: 'In 30 years, everyone went home safe.' },
    { value: 'Creative Excellence', text: 'Its work became iconic in its field.' },
    { value: 'Compassionate Care', text: 'When someone was struggling, the company showed up for them.' },
    { value: 'Customer Focused', text: 'Customers drove across town to keep coming back.' },
    { value: 'Resident Dignity', text: 'The neighbors were proud to have it on their block.' },
    { value: 'Individual Responsibility', text: 'It was built by someone who took full ownership, no excuses.' },
  ]},
]

export const buyerQuizQuestions: QuizQuestion[] = [
  { id: 'b01', type: 'rank', title: 'Two targets, same price', setup: 'Two comparable businesses are priced the same. Rank what would tip you toward one.', options: [
    { value: 'Sustainability', text: 'Its operating model uses less material and energy per unit, built to last in a resource-constrained future.' },
    { value: 'Environmental Stewardship', text: 'It has a clean environmental record and has protected the wetland on its property.' },
    { value: 'Free Enterprise', text: 'It’s lightly regulated, and you’d have full freedom to run it your way.' },
    { value: 'Employee Wellbeing', text: 'Its employees report high morale, low burnout and strong benefits.' },
  ]},
  { id: 'b02', type: 'rank', title: 'What you’re really buying', setup: 'Every business has one asset that justifies the price. Rank which one matters most to you.', options: [
    { value: 'Craftsmanship', text: 'A team of skilled makers whose hand-work can’t be replicated.' },
    { value: 'Excellence & Quality', text: 'Proven quality systems and an almost-zero defect rate.' },
    { value: 'Creative Excellence', text: 'A beloved brand with a distinctive creative identity.' },
    { value: 'Innovation & Discovery', text: 'A pipeline of patents and prototypes no one has brought to market yet.' },
  ]},
  { id: 'b03', type: 'rank', title: 'The pricing decision', setup: 'Margins are thin, and you could raise prices 15%. Rank what weighs on you most.', options: [
    { value: 'Customer Focused', text: 'How customers will experience it, and whether they’ll still feel valued.' },
    { value: 'Client Stewardship', text: 'Keeping the trust of the long-standing clients the seller introduced you to personally.' },
    { value: 'Individual Responsibility', text: 'It’s my call and my risk. If the numbers say raise, I raise.' },
    { value: 'Accessible to All', text: 'Whether lower-income customers can still afford what you sell.' },
  ]},
  { id: 'b04', type: 'rank', title: 'Five years in', setup: 'Picture your ownership five years after the close. Rank the picture you’d most want.', options: [
    { value: 'Employee Ownership', text: 'Employees own a significant share through an ESOP or equity plan.' },
    { value: 'Family Values', text: 'It’s a family business: your family is involved, and it supports the life you want at home.' },
    { value: 'Long Term Investment', text: 'You’re still holding it and reinvesting profits, with no exit in sight.' },
    { value: 'Economic Mobility', text: 'Your entry-level hires are moving into management and building wealth.' },
  ]},
  { id: 'b05', type: 'pick', title: 'Lightning round', setup: 'What would you most want people to say about you as an owner?', options: [
    { value: 'Integrity', text: 'Their handshake was as good as a contract.' },
    { value: 'Free Enterprise', text: 'They took the risk and made it work on their own terms.' },
    { value: 'Employee Wellbeing', text: 'It got better to work there after they took over.' },
    { value: 'Environmental Stewardship', text: 'They cleaned up the site and kept it clean.' },
    { value: 'Craftsmanship', text: 'They respected the craft and protected it.' },
    { value: 'Economic Mobility', text: 'They gave people a real way up.' },
    { value: 'Client Stewardship', text: 'Clients stayed because they were treated with care.' },
    { value: 'Family Values', text: 'They built it around family, theirs and their employees’.' },
  ]},
  { id: 'b06', type: 'rank', title: 'Diligence findings', setup: 'Your first-year capital budget can fully fix one issue right away. Rank which you’d fix first.', options: [
    { value: 'Worker Safety', text: 'Outdated machine guarding and two recordable injuries last year.' },
    { value: 'Equity', text: 'Pay gaps between people in similar roles.' },
    { value: 'Conscious Capitalism', text: 'No commitment to anyone beyond the owner: suppliers squeezed, community ignored.' },
    { value: 'Investing Local', text: '70% of purchasing goes to out-of-state vendors when local options exist.' },
  ]},
  { id: 'b07', type: 'rank', title: 'Consolidating a location', setup: 'You need to consolidate two locations into one. Rank what matters most in how you do it.', options: [
    { value: 'Integrity', text: 'Being straight with everyone from day one, even before you have every answer.' },
    { value: 'Workforce Development', text: 'Retraining affected staff for roles at the remaining location.' },
    { value: 'Compassionate Care', text: 'Extra support for the people hit hardest.' },
    { value: 'Resident Dignity', text: 'Working with neighbors on what happens to the building, so the block isn’t left with a vacancy.' },
  ]},
  { id: 'b08', type: 'rank', title: 'Closing faster and cheaper', setup: 'The seller’s broker suggests ways to close faster and cheaper. Rank what you’d most refuse to give up.', options: [
    { value: 'Sustainability', text: 'Your plan to keep the sustainable sourcing, even though it costs more.' },
    { value: 'Craftsmanship', text: 'Keeping production in-house instead of outsourcing it.' },
    { value: 'Economic Mobility', text: 'Your commitment to hire from the neighborhood at livable starting wages.' },
    { value: 'Integrity', text: 'Telling your lender about a cash-flow concern you found, even if it raises your rate.' },
  ]},
  { id: 'b09', type: 'rank', title: 'Your first year', setup: 'Your own hours are the scarcest resource in year one. Rank where you’d spend them.', options: [
    { value: 'Environmental Stewardship', text: 'Cutting the site’s energy use and waste.' },
    { value: 'Excellence & Quality', text: 'Getting standards and quality metrics where you want them.' },
    { value: 'Workforce Development', text: 'Building an apprenticeship pipeline with the local community college.' },
    { value: 'Family Values', text: 'Setting boundaries so ownership doesn’t swallow family life, and building that culture for your team.' },
  ]},
  { id: 'b10', type: 'pick', title: 'Lightning round', setup: 'Which line belongs in your pitch to the seller?', options: [
    { value: 'Excellence & Quality', text: 'I’ll protect your standards like they’re my own.' },
    { value: 'Investing Local', text: 'I live here. This business stays here.' },
    { value: 'Employee Ownership', text: 'I want your employees to own part of what they build.' },
    { value: 'Accessible to All', text: 'I want more people to be able to buy what you make.' },
    { value: 'Conscious Capitalism', text: 'I’ll run it for every stakeholder, not just me.' },
    { value: 'Workforce Development', text: 'I’ll train the next generation of your trade.' },
    { value: 'Innovation & Discovery', text: 'I’ll take what you built somewhere new.' },
    { value: 'Long Term Investment', text: 'I’m not here to flip it. I’m here for decades.' },
  ]},
  { id: 'b11', type: 'rank', title: 'Your management bonus plan', setup: 'You’re designing the bonus plan for your leadership team. Rank which measure you’d weight most.', options: [
    { value: 'Creative Excellence', text: 'Creative awards, design recognition and standout launches.' },
    { value: 'Client Stewardship', text: 'Retention and satisfaction of key clients.' },
    { value: 'Employee Ownership', text: 'Growth in employee ownership participation.' },
    { value: 'Worker Safety', text: 'Safety performance.' },
  ]},
  { id: 'b12', type: 'rank', title: 'Your big growth bet', setup: 'You have capital for one major initiative. Rank which you’d fund.', options: [
    { value: 'Innovation & Discovery', text: 'A new product line built on untested technology.' },
    { value: 'Customer Focused', text: 'A complete overhaul of the customer experience.' },
    { value: 'Resident Dignity', text: 'A community space and a resident hiring partnership with the neighborhood.' },
    { value: 'Investing Local', text: 'Moving suppliers, banking and services to local partners.' },
  ]},
  { id: 'b13', type: 'rank', title: 'An incentive with strings', setup: 'The city offers an incentive package with conditions attached. Rank your reaction.', options: [
    { value: 'Free Enterprise', text: 'Pass. I’d rather run lean without government strings.' },
    { value: 'Equity', text: 'Take it, and fully commit to the inclusive hiring and contracting targets.' },
    { value: 'Accessible to All', text: 'Use it to make the space and services accessible to people with disabilities and limited means.' },
    { value: 'Compassionate Care', text: 'Use it to fund an emergency assistance fund for employees.' },
  ]},
  { id: 'b14', type: 'rank', title: 'Your owner’s creed', setup: 'Rank the line you’d most want pinned above your desk.', options: [
    { value: 'Employee Wellbeing', text: 'If my people aren’t okay, the business isn’t okay.' },
    { value: 'Individual Responsibility', text: 'I own the outcome. No excuses.' },
    { value: 'Conscious Capitalism', text: 'Profit is how we fund the purpose.' },
    { value: 'Long Term Investment', text: 'Decades, not quarters.' },
  ]},
  { id: 'b15', type: 'pick', title: 'Lightning round', setup: 'Ten years from now, which headline would make you proudest?', options: [
    { value: 'Sustainability', text: 'Local firm proves profitable and resource-efficient can go together' },
    { value: 'Equity', text: 'Business opens doors for workers long shut out' },
    { value: 'Worker Safety', text: 'A decade without a serious injury' },
    { value: 'Creative Excellence', text: 'Local brand wins national design honors' },
    { value: 'Compassionate Care', text: 'Owner steps up for employees in crisis' },
    { value: 'Customer Focused', text: 'Customers name it the best in the city' },
    { value: 'Resident Dignity', text: 'Neighbors call business a true partner on the block' },
    { value: 'Individual Responsibility', text: 'Self-made owner turns struggling business around' },
  ]},
]

// One blurb per CORE_VALUES label, per audience — shown on the results screen and
// used to assemble a starter "values statement" draft after a first-time quiz.
export const valueBlurbs: Record<string, { buyer: string; seller: string }> = {
  'Investing Local': {
    seller: 'You see your business as part of the local economy, not separate from it. You’ll likely favor a buyer who keeps jobs, suppliers and decisions close to home.',
    buyer: 'You want your capital to strengthen your own community. You’re likely to favor targets with local roots and to keep spending in the region after the close.',
  },
  'Craftsmanship': {
    seller: 'You built something with skill and care, and you judge it by how it’s made. You’ll want a buyer who protects the know-how, not just the customer list.',
    buyer: 'You value skill that takes years to build. You’ll look for businesses where the craft is the competitive edge, and you’ll invest to protect it.',
  },
  'Employee Wellbeing': {
    seller: 'Your team’s wellbeing was never a perk to you; it was part of the job. Expect to weigh how a buyer will treat your people as heavily as the price.',
    buyer: 'You see a healthy team as the foundation of a healthy business. Expect to check culture and burnout as closely as the financials.',
  },
  'Long Term Investment': {
    seller: 'You think in decades. A patient buyer who will reinvest rather than strip and flip is likely worth more to you than the top bid.',
    buyer: 'You’re a builder, not a flipper. You’ll favor businesses you can hold, reinvest in and grow for a generation.',
  },
  'Equity': {
    seller: 'Fairness matters to you: who gets opportunity, and how it’s shared. You’ll want a buyer whose pay, hiring and contracting reflect that.',
    buyer: 'You want ownership to widen opportunity, not narrow it. You’ll likely bring fairness to pay, hiring and contracting from day one.',
  },
  'Environmental Stewardship': {
    seller: 'You treat the land, water and air your business touches as your responsibility. A buyer’s environmental track record will matter to you.',
    buyer: 'You take responsibility for the environmental footprint you buy. Expect to look hard at a site’s history and invest in caring for it.',
  },
  'Employee Ownership': {
    seller: 'You believe the people who built the business should share in it. An employee buyout, ESOP or equity plan may be closer to your ideal exit than an outside sale.',
    buyer: 'You believe employees should own part of what they build. You may structure your ownership to share equity over time.',
  },
  'Accessible to All': {
    seller: 'You want what you built to reach everyone, not just those who can pay the most. You’ll look for a buyer who won’t price out the customers who got you here.',
    buyer: 'You want what you sell to reach more people. Expect to look for ways to widen access rather than chase only the top of the market.',
  },
  'Worker Safety': {
    seller: 'Everyone going home safe is non-negotiable for you. You’ll look closely at how a buyer plans to invest in equipment, training and safety culture.',
    buyer: 'You won’t trade safety for margin. You’ll put early capital into equipment, training and a culture where people speak up.',
  },
  'Creative Excellence': {
    seller: 'Your business has a voice and a look all its own, and you’re proud of it. You’ll want a buyer who protects that creative spark instead of standardizing it away.',
    buyer: 'You’re drawn to businesses with a creative identity. You’ll protect and invest in the brand’s distinctive voice.',
  },
  'Economic Mobility': {
    seller: 'You’ve run the business as a ladder for people. You’ll want a buyer who keeps hiring from the community and keeps promotion paths open.',
    buyer: 'You see ownership as a way to build ladders for others. Expect to hire from the community and create real promotion paths.',
  },
  'Free Enterprise': {
    seller: 'You value the freedom to build, take risks and decide for yourself, and you’ll likely extend that same freedom to your buyer. Expect to favor clean deals with few conditions.',
    buyer: 'You value the freedom to take risks and run things your way. You’ll favor deals with few strings and a lean, self-directed operating style.',
  },
  'Conscious Capitalism': {
    seller: 'You believe profit and purpose belong together. You’ll be drawn to buyers who talk about all their stakeholders, not just returns.',
    buyer: 'You believe business works best when it serves employees, customers, community and owners together. Expect to define a purpose, not just targets.',
  },
  'Compassionate Care': {
    seller: 'You lead with heart, especially when people are struggling. How a buyer treats people in hard moments will tell you a lot about whether they’re the right fit.',
    buyer: 'You lead with empathy, especially when people are in hard situations. Your team will likely see you show up when it counts.',
  },
  'Sustainability': {
    seller: 'You care about building something that can last without using up its people or its resources. A buyer’s operating model will matter to you as much as their offer.',
    buyer: 'You want a business that can endure without using up its people or its resources. You’ll favor efficient, durable operating models over short-term gains.',
  },
  'Workforce Development': {
    seller: 'You’ve invested in growing people’s skills. You’ll want a buyer who keeps training and apprenticeships going after you leave.',
    buyer: 'You see the business as a training ground. Expect to build apprenticeships and skills pipelines into your plan.',
  },
  'Customer Focused': {
    seller: 'Your customers’ experience has always been your scoreboard. You’ll want evidence that a buyer will keep service where your customers expect it.',
    buyer: 'You believe the customer experience is the business. Expect your first moves to focus on how customers are served.',
  },
  'Resident Dignity': {
    seller: 'You treat the neighbors and residents around your business as stakeholders. A buyer’s plans for the block and the community will weigh on your decision.',
    buyer: 'You treat neighbors and residents as real stakeholders. You’ll likely engage the community before making big moves.',
  },
  'Excellence & Quality': {
    seller: 'You set a high bar and held it. You’ll be wary of any buyer who sees your standards as a cost to cut.',
    buyer: 'You look for businesses with high standards, and then you raise them. Quality metrics will likely be among your first priorities.',
  },
  'Family Values': {
    seller: 'Family has shaped how you run the business, yours and your team’s. You may favor a family successor or a buyer who keeps a family-first culture.',
    buyer: 'Family shapes how you’ll own, yours and your team’s. Expect to build a business that supports family life rather than competing with it.',
  },
  'Innovation & Discovery': {
    seller: 'You’ve always been curious about what’s next. A buyer with the capital and appetite to keep experimenting may be the legacy you’re looking for.',
    buyer: 'You’re buying a platform for what’s next. You’ll favor targets with untapped ideas and invest in experimentation.',
  },
  'Individual Responsibility': {
    seller: 'You believe in owning your choices and their outcomes. You’ll likely respect a buyer’s right to run it their way once the deal is done.',
    buyer: 'You own your decisions and their consequences. You’ll likely run a lean, accountable operation and expect the same from your team.',
  },
  'Integrity': {
    seller: 'Your word is your bond, and you’d rather lose a deal than win it dishonestly. Expect full disclosure from you, and expect to require it from your buyer.',
    buyer: 'You’d rather walk away than close on a half-truth. Expect honest diligence from you, and expect to require honesty from sellers and lenders.',
  },
  'Client Stewardship': {
    seller: 'Clients trusted you with things that matter, and you treat that trust as something to hand over carefully. A buyer’s plan to protect key relationships will be essential to you.',
    buyer: 'You see inherited client relationships as a trust to honor. Expect to spend time personally with key accounts during the transition.',
  },
}
