import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T>(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  // If the URL is not absolute, make it absolute
  let absoluteUrl = url;
  if (!url.startsWith('http')) {
    const baseUrl = window.location.origin;
    absoluteUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  }
  
  console.log('API request to:', absoluteUrl);
  
  try {
    const res = await fetch(absoluteUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "same-origin",
      mode: "cors",
    });
    
    console.log('Response received:', res.status, res.statusText);
    
    await throwIfResNotOk(res);
    return res.json();
  } catch (error) {
    console.error('API request error to', absoluteUrl, ':', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Same URL handling as in apiRequest
    let url = queryKey[0] as string;
    let absoluteUrl = url;
    if (!url.startsWith('http')) {
      const baseUrl = window.location.origin;
      absoluteUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    
    console.log('Query request to:', absoluteUrl);
    
    try {
      const res = await fetch(absoluteUrl, {
        credentials: "same-origin",
        mode: "cors",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log('Query response received:', res.status, res.statusText);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query request error to', absoluteUrl, ':', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
