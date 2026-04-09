/** Open-Meteo (no API key) — forecast for a stop on a given day. */
export async function fetchWeatherSnapshot(lat: number, lng: number, date: Date) {
  const day = date.toISOString().slice(0, 10);
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "weathercode,temperature_2m_max,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", day);
  url.searchParams.set("end_date", day);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    daily?: {
      weathercode?: number[];
      temperature_2m_max?: number[];
      precipitation_probability_max?: number[];
    };
  };
  const i = 0;
  return {
    code: data.daily?.weathercode?.[i],
    tempMax: data.daily?.temperature_2m_max?.[i],
    precipProb: data.daily?.precipitation_probability_max?.[i],
  };
}
