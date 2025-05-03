/**
 * API client for making requests to the server
 */

const API_BASE_URL = ''; // Empty string means it will use the current origin (relative URLs)

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Make an API request to the server
 * 
 * @param method HTTP method
 * @param endpoint API endpoint
 * @param data Request body data (for POST, PUT)
 * @param options Additional fetch options
 * @returns Fetch Response object
 */
export async function apiRequest(
  method: HttpMethod, 
  endpoint: string, 
  data?: any, 
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  
  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies
    ...options,
  };
  
  if (data !== undefined && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  try {
    console.log(`API request to:`, url);
    const response = await fetch(url, config);
    console.log(`Response received:`, response.status, response.statusText);
    
    if (!response.ok && response.status !== 401) {
      // For 401 Unauthorized, we'll handle it in the component
      throw new Error(`API request error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request error to`, url, `:`, error);
    throw error;
  }
}

/**
 * Get data from the API
 * 
 * @param endpoint API endpoint
 * @returns Parsed JSON response
 */
export async function getData(endpoint: string): Promise<any> {
  const response = await apiRequest('GET', endpoint);
  return response.json();
}

/**
 * Post data to the API
 * 
 * @param endpoint API endpoint
 * @param data Request body data
 * @returns Parsed JSON response
 */
export async function postData(endpoint: string, data: any): Promise<any> {
  const response = await apiRequest('POST', endpoint, data);
  return response.json();
}

/**
 * Put data to the API
 * 
 * @param endpoint API endpoint
 * @param data Request body data
 * @returns Parsed JSON response
 */
export async function putData(endpoint: string, data: any): Promise<any> {
  const response = await apiRequest('PUT', endpoint, data);
  return response.json();
}

/**
 * Delete data from the API
 * 
 * @param endpoint API endpoint
 * @returns Parsed JSON response
 */
export async function deleteData(endpoint: string): Promise<any> {
  const response = await apiRequest('DELETE', endpoint);
  return response.json();
}