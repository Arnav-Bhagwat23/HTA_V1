export const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch text from ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

export const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};
