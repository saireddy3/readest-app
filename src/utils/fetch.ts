export const fetchWithAuth = async (url: string, options: RequestInit) => {
  // Authentication removed, perform regular fetch
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    console.error('Error:', errorData.error || response.statusText);
    throw new Error(errorData.error || 'Request failed');
  }

  return response;
};
