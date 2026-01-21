import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// Logo mapping from kindredcollective.co.uk
const logoMappings: Record<string, string> = {
  'addition': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture3_5ed61f04-3cfa-41cc-a016-a1f21d4857e2.png?v=1751028399',
  'am-distilling-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/BlackBridgeDistillery.png?v=1760618825',
  'anderson-cole-group': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture5.png?v=1751023023',
  'astute-beverages': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/AstuteBeverages.png?v=1760620711',
  'avallen-solutions': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Green_Background-Winner-Avallen_Solutions.png?v=1749570994',
  'b2c-group-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture17.png?v=1752091278',
  'bb-comms': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/BBComms.png?v=1760623040',
  'bbj-k': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/BBJ-K-logo-profile.png?v=1749569658',
  'berlin-packaging': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/brunierben_logo.png?v=1749567681',
  'bobbys-gin-distribution-bv': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Bobby_sGin.png?v=1749568586',
  'bostocap-srl': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture4_d3087a84-c028-4ab5-b662-e6866b22aff8.png?v=1751028533',
  'bowimi': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/images_7666c97f-1723-4f8a-89ea-e54f395dd7d1.png?v=1749570880',
  'buddy-creative': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/BuddyCreative.jpg?v=1765918416',
  'burlington-bottling-co': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Burlington.png?v=1749571424',
  'cleverdrinks-photography': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Clever_4-3.png?v=1749567849',
  'clyde-presentation-packaging': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/ClydePackaging.png?v=1749570746',
  'cocktail-connoisseurs': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture3.png?v=1751021264',
  'cone-accounting-limited': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture4.png?v=1751021920',
  'cooper-parry': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/download_c9b3a44c-c405-4c79-8f42-5c3de17b0b01.png?v=1749567591',
  'crate-pr': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/CC-StackedLogo_Orange_646c9e1b-3489-4910-8c7a-efe4f3f58563.png?v=1749570683',
  'cutlass-communications': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Cutlass.png?v=1749569122',
  'diglis-consulting': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture13.png?v=1752074983',
  'dimax-digital': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Dimax.png?v=1749569428',
  'drincx-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture1_7364d665-7aa2-4dd7-83a7-e255041d029c.png?v=1751028234',
  'easy-chew': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/EasyChew_Logo_RGB_Normal_Charcoal_ec6ac811-6aa5-4a98-8b87-b98acf08d387.png?v=1749557383',
  'flourish-creative': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture1.png?v=1749630494',
  'frederick-wilkinson': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture8.png?v=1751025970',
  'giraffe-distillers-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/1681740050921.png?v=1749567428',
  'graceful-monkey': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/GracefulMonkey.jpg?v=1765918843',
  'greenbox-designs': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/logogreenbox_002.png?v=1749629844',
  'halo-business-support-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/images_2_3dbfe0d0-a634-4916-b2dd-053fde4fcdda.png?v=1749557613',
  'hensol-castle-distillery': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/HensolCastle.png?v=1749569035',
  'highspirit-agency': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture19.jpg?v=1752091963',
  'iconic-distro-company-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/iconic_distro_co_ltd_logo.png?v=1749570317',
  'kind-community': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture20.jpg?v=1752093552',
  'label-apeel-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture14.png?v=1752075767',
  'london-city-bond-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture2.png?v=1749630618',
  'lucie-rhoades-comms': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture2_e8f4cc57-fb92-4c4d-b9f6-bc7f3b0bb62b.png?v=1751028320',
  'maffeo-drinks-s-r-o': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/9374e364-300f-4051-abff-9fa74dee365e_1506x850_17d7be92-e79c-4dcb-8e71-e7e2b514eb09.png?v=1749567973',
  'mariller': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture12.png?v=1752074641',
  'marillier-consulting': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/38cc2f7d-214d-471c-afd2-83da053bcce1_878e1685-552b-4d38-97e2-1e32bfe894b0.png?v=1749571487',
  'midday-studio': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Midday-6.png?v=1749569987',
  'nightcap-brands': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/071a93eb-7883-49fe-b6aa-5c266cf3b6a4_1.png?v=1749568188',
  'nolen-consultancy': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/1724247284154_0a613a14-61d9-4738-8d13-b6b043904559.jpg?v=1749630077',
  'on-a-plate-growth': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/OnaPlate.png?v=1749570090',
  'orange-by-marmalade': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Orange_Marmalade_Logo-01_c221c308-f483-4b93-8041-8bc23bad1d7d.png?v=1749567761',
  'partner-up': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/PartnerUp.png?v=1749569800',
  'pear-sons-production-studio': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/pear_sons_logo-07_copy_31e949f6-eaea-457e-a691-579d3af95a8a.png?v=1749570591',
  'propak-uk': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Propak.png?v=1749571305',
  'red-distillery': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture18.png?v=1752091766',
  'saverglass': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/SaverGlass.png?v=1760620378',
  'sbp-events-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture2_dd6dfc39-0b80-4b8c-8da8-3777f5e0500f.png?v=1751020674',
  'scale-drinks': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture16.png?v=1752091109',
  'seven-sages': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/SevenSages.png?v=1749568715',
  'smurfit-westrock-saxon': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Smurfit.png?v=1749569490',
  'soho-drinks-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/SohoDrinks.png?v=1749569907',
  'spirited-marketing': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/SB-650x650-12-3_51d63abf-9a7d-4d4e-9aa5-50914275f27d.png?v=1749570244',
  'supplychain21-ltd': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/SupplyChain21.png?v=1760622791',
  'the-advocate-group': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/AdvocateGroup.png?v=1749569577',
  'the-brand-weaver': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/brand-weaver-cap-front_fd8fa725-7691-4ad0-9ea5-5a1056e1178c.png?v=1749571241',
  'the-custom-spirit-co': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/Picture7.png?v=1751025789',
  'this-is-undefined': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/undefined_yellow_63124417-b92b-424e-8ec6-adea6ce9df4f.png?v=1749568901',
  'tortuga': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/220b10b9-8c41-430f-843b-30da6f01fd93_b78dffd6-412e-4f58-a8db-e063b92e65a8.png?v=1749570384',
  'verallia': 'https://cdn.shopify.com/s/files/1/0924/3095/8923/files/verallia.png?v=1749571118',
}

// POST /api/admin/update-logos - Update all supplier logos from kindredcollective.co.uk
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()

  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0
  const errors: string[] = []

  for (const [slug, logoUrl] of Object.entries(logoMappings)) {
    const { data, error } = await supabase
      .from('Supplier')
      .update({ logoUrl })
      .eq('slug', slug)
      .select('id')

    if (error) {
      errors.push(`${slug}: ${error.message}`)
      errorCount++
    } else if (!data || data.length === 0) {
      notFoundCount++
    } else {
      successCount++
    }
  }

  return successResponse({
    message: 'Logo update complete',
    updated: successCount,
    notFound: notFoundCount,
    errors: errorCount,
    errorDetails: errors.length > 0 ? errors : undefined,
  })
}

// GET endpoint to check the mappings
export async function GET() {
  return successResponse({
    totalMappings: Object.keys(logoMappings).length,
    mappings: logoMappings,
  })
}
