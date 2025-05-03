import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Overload signatures
export async function apiRequest<T>(url: string): Promise<T>;
export async function apiRequest<T>(method: string, url: string): Promise<T>;
export async function apiRequest<T>(method: string, url: string, data: any): Promise<T>;
export async function apiRequest<T>(
  urlOrMethod: string,
  urlOrOptions?: string | {
    method?: string;
    data?: unknown;
  },
  optionalData?: any
): Promise<T | Response> {
  let method = 'GET';
  let url = urlOrMethod;
  let data: any = null;
  
  // Handle overloaded function signatures
  if (arguments.length >= 2) {
    if (typeof urlOrOptions === 'string') {
      // apiRequest(method, url) or apiRequest(method, url, data)
      method = urlOrMethod;
      url = urlOrOptions;
      data = optionalData;
    } else if (urlOrOptions && typeof urlOrOptions === 'object') {
      // apiRequest(url, options)
      method = urlOrOptions.method || 'GET';
      data = urlOrOptions.data;
    }
  }
  
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
    
    // If the response content type is JSON and caller wants a parsed type, parse it
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Clone the response since we can only read the body once
      const resClone = res.clone();
      try {
        const json = await resClone.json();
        return json;
      } catch (jsonError) {
        console.warn('Failed to parse JSON response:', jsonError);
        // Fall back to returning the response object
      }
    }
    
    // Return the full response object for manual handling
    return res;
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
