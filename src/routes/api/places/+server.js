import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ url }) {
  const query = url.searchParams.get('query');
  if (!query) return json({ documents: [] });

  const kakaoKey = env.KAKAO_REST_KEY;
  if (!kakaoKey) {
    return json({ error: 'KAKAO_REST_KEY not set' }, { status: 500 });
  }

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
    { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
  );

  const data = await res.json();
  return json(data);
}
