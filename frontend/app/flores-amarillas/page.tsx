import SeoProductLanding, { landingMetadata } from '../components/SeoProductLanding';
import { getLanding } from '@/utils/seoLandings';

const landing = getLanding('flores-amarillas')!;

export const revalidate = 3600;
export const metadata = landingMetadata(landing);

export default function Page() {
  return <SeoProductLanding landing={landing} />;
}
