export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;        // ISO date string e.g. '2026-05-01'
  readMins: number;
  body: string[];      // array of paragraph strings
}

export const posts: Post[] = [
  {
    slug: 'how-to-choose-the-right-acp-sheet',
    title: 'How to Choose the Right ACP Sheet',
    excerpt:
      'ACP (Aluminium Composite Panel) comes in dozens of grades, finishes and core types. Here is a straightforward guide to picking the right one for your project.',
    date: '2026-05-01',
    readMins: 5,
    body: [
      'Aluminium Composite Panels (ACP) have become the go-to cladding material for commercial facades, signage boards, interior partitions and shop fronts. With so many options on the market, choosing the correct grade can feel overwhelming — but it comes down to a few key factors: end use, fire rating, thickness and finish.',
      'The first decision is core type. Standard polyethylene (PE) core panels are cost-effective and widely used for interior applications and signage. For building exteriors and areas where fire safety is paramount, opt for a fire-retardant (FR) or mineral-filled core, which meets IS:2553 and international fire standards. Never use PE-core panels on high-rise facades.',
      'Thickness is the next consideration. 3 mm panels are popular for interior display and exhibition work. 4 mm is the most common for shopfronts and light external cladding. 6 mm panels are specified for high-wind-load facades and heavy-duty applications. Always check the structural engineer\'s specification before ordering.',
      'Surface finish dramatically affects the final look. PVDF (polyvinylidene fluoride) coated panels offer superior UV resistance and colour retention — ideal for outdoor use. Polyester-coated panels are a more economical option suited to indoor environments. Brushed, mirror and wood-effect prints are also available for decorative applications.',
      'Finally, verify the brand and certifications. Reputable manufacturers provide mill test certificates confirming aluminium alloy grade (typically 3003 or 5052), coating thickness and adhesion results. Buying from a certified distributor ensures you receive genuine material that performs as specified. When in doubt, request a sample and bend test before committing to a large order.',
    ],
  },
  {
    slug: 'pvc-vs-other-materials-a-buyers-guide',
    title: 'PVC vs Other Materials: A Buyer\'s Guide',
    excerpt:
      'PVC competes with wood, aluminium, fibreglass and ACP in many applications. We break down the pros and cons so you can make the right call for your budget and project.',
    date: '2026-04-15',
    readMins: 6,
    body: [
      'Choosing a material for partitions, cladding, doors, pipes or profiles involves balancing cost, durability, aesthetics and maintenance. PVC (polyvinyl chloride) is often the most economical option, but it is not always the right choice. Understanding where it excels — and where it falls short — helps you specify correctly from the start.',
      'PVC vs Wood: Timber remains popular for its natural look and workability, but it is vulnerable to moisture, termites and rot. PVC boards and profiles are completely moisture-proof, termite-resistant and require no painting or sealing. For wet areas such as bathrooms, kitchens and commercial kitchens, PVC outperforms timber decisively. Wood still wins on aesthetics for high-end interior joinery, though wood-grain PVC foils have closed the gap considerably.',
      'PVC vs Aluminium: Aluminium sections are stronger and more rigid than PVC, making them the preferred choice for structural window frames, large-span curtain walls and heavy doors. PVC profiles, however, provide better thermal insulation (lower U-values), are lighter, easier to cut on site and cost significantly less. For residential windows and light commercial partitions, PVC is the value-for-money leader.',
      'PVC vs Fibreglass (GRP): Fibreglass is used in applications demanding very high strength-to-weight ratio — boat hulls, industrial tanks and corrosive environments. PVC cannot match fibreglass in mechanical strength or chemical resistance at elevated temperatures. However, for standard drainage, plumbing and electrical conduit applications, PVC is far cheaper and easier to fabricate.',
      'PVC vs ACP: ACP is primarily a facade and signage material offering a flat, metallic aesthetic that PVC cannot replicate. For interior wall panelling and false ceilings, PVC panels are lighter, simpler to install and considerably more affordable. For exterior cladding where aesthetics and UV resistance are priorities, ACP is the better choice. Many projects use both — ACP on the facade and PVC internally — to optimise cost and appearance.',
      'The bottom line: PVC delivers the best value in moisture-prone, cost-sensitive applications where aesthetics are secondary. Match the material to the environment, loads and budget, and always source from a quality distributor who can provide specification sheets and samples before you commit.',
    ],
  },
  {
    slug: 'bulk-buying-tips-for-contractors',
    title: 'Bulk Buying Tips for Contractors',
    excerpt:
      'Ordering materials in volume is one of the biggest levers contractors have on project profitability. These practical tips will help you buy smarter, reduce waste and negotiate better rates.',
    date: '2026-04-01',
    readMins: 4,
    body: [
      'Material procurement is often where construction projects win or lose margin. Buying in bulk sounds simple, but doing it well requires planning, supplier relationships and a clear understanding of your project pipeline. Here are the most impactful strategies experienced contractors use.',
      'Consolidate across projects. Rather than purchasing separately for each job, aggregate your material requirements across all active and upcoming projects. A combined order for three jobs is almost always cheaper per unit than three separate orders. Maintain a rolling three-month forecast so you can place consolidated orders with confidence.',
      'Negotiate a trade account and standing rates. Once you are placing regular orders, ask your distributor for a formal trade account with agreed pricing tiers. Locking in rates for a quarter protects you from price fluctuations and removes the need to re-quote every purchase. Distributors value predictable volume and will reward loyalty with better terms.',
      'Understand lead times and buffer accordingly. Running out of material mid-project is far more expensive than holding a small overstock. Ask your distributor for typical stock availability and lead times, then build a 10–15% buffer into your material quantities for critical items. For seasonal peaks, order earlier than you think necessary.',
      'Inspect on delivery, every time. Bulk orders occasionally contain damaged, off-spec or mis-labelled items. Train your site staff to count, check dimensions and photograph any discrepancies before the delivery vehicle leaves. Most distributors will resolve issues quickly when reported immediately; disputes raised days later are harder to resolve.',
      'Request GST invoices and keep records. Every purchase should come with a proper tax invoice for your input tax credit claims. Organised procurement records also make project costing and client billing far more accurate. Use a simple spreadsheet or procurement app to log each delivery against its project code.',
    ],
  },
  {
    slug: 'caring-for-pvc-products-maintenance-101',
    title: 'Caring for PVC Products: Maintenance 101',
    excerpt:
      'PVC is celebrated for being low-maintenance, but "low" does not mean "none". A simple care routine keeps PVC profiles, sheets and pipes looking and performing their best for decades.',
    date: '2026-03-15',
    readMins: 4,
    body: [
      'One of the biggest selling points of PVC is its minimal maintenance requirement compared to wood, metal or concrete. However, neglect over many years can lead to discolouration, brittleness or joint failures that are expensive to repair. A little regular attention goes a long way.',
      'Cleaning: For PVC window profiles, wall panels and cladding, a soft cloth or sponge with warm water and a mild detergent is all you need. Wipe surfaces down every three to six months — more frequently in dusty or coastal environments. Avoid abrasive cleaners, steel wool or harsh solvents such as acetone, which can scratch or cloud the surface.',
      'UV exposure: Standard PVC contains UV stabilisers, but prolonged exposure to intense sunlight can cause gradual yellowing and surface chalking over many years. In very sunny climates, choose products with enhanced UV stabilisers or apply a UV-protective coating periodically. Lighter colours generally show UV degradation less than white.',
      'Thermal expansion: PVC expands and contracts with temperature. Profiles installed without adequate expansion gaps can bow or crack in extreme heat. Always follow the manufacturer\'s installation guidelines for expansion allowances, particularly for long runs of cladding or ceiling panels.',
      'Pipe and drainage maintenance: PVC pipes rarely need attention, but check exposed outdoor pipe runs annually for joint integrity and UV degradation. Use only approved PVC solvent cement and primer for any repairs — never use metal pipe fittings on PVC without the correct transition couplings.',
      'Long-term performance: PVC products correctly installed and lightly maintained can last 20–50 years. The investment in quality material from a reputable distributor and a minimal care routine will deliver years of trouble-free performance and protect the value of the structures they form part of.',
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug);
}
