import SeoProductLanding, { landingMetadata } from '../components/SeoProductLanding';
import { getLanding } from '@/utils/seoLandings';

const landing = getLanding('ramos-de-flores')!;

export const revalidate = 3600;
export const metadata = landingMetadata(landing);

export default function Page() {
  return <SeoProductLanding landing={landing} />;
}
