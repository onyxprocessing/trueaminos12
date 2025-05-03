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
      credentials: "include",
      mode: "cors",
    });
    
    console.log('Response received:', res.status, res.statusText);
    
    // Check if the response is ok
    if (!res.ok) {
      // For 4xx and 5xx errors, try to get the error message from the response
      try {
        const errorData = await res.json();
        console.error(`Server error: ${res.status} ${res.statusText}`, errorData);
        throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
      } catch (parseError) {
        // If we can't parse the JSON, just throw with the status
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    }
    
    // Try to parse the JSON response
    try {
      return await res.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    const error = err as Error;
    console.error('API request error to', absoluteUrl, ':', error);
    // Throw a more user-friendly error message
    throw new Error(`Failed to ${method.toLowerCase()} ${absoluteUrl.split('/').pop() || 'resource'}: ${error.message || 'Unknown error'}`);
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
        credentials: "include",
        mode: "cors",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log('Query response received:', res.status, res.statusText);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Check if the response is ok
      if (!res.ok) {
        // For 4xx and 5xx errors, try to get the error message from the response
        try {
          const errorData = await res.json();
          console.error(`Server error: ${res.status} ${res.statusText}`, errorData);
          throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
        } catch (parseError) {
          // If we can't parse the JSON, just throw with the status
          throw new Error(`${res.status}: ${res.statusText}`);
        }
      }
      
      // Try to parse the JSON response
      try {
        return await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Query request error to', absoluteUrl, ':', error);
      // Throw a more user-friendly error message
      throw new Error(`Failed to fetch ${absoluteUrl.split('/').pop() || 'resource'}: ${error.message || 'Unknown error'}`);
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
