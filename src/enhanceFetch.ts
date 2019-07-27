import deepmerge from 'deepmerge'

interface EnhancedFetch {
  get: (url: string, options?: RequestInit) => Promise<any>
  post: (url: string, body?: {}, options?: RequestInit) => Promise<any>
}

const baseConfig: RequestInit = {
  mode: 'cors',
  credentials: 'include'
}

const normalizeContentType = (contentType: string | null): string | null => {
  if (!contentType) return null

  if (contentType.indexOf('application/json') !== -1) {
    return 'json'
  }
  if (contentType.indexOf('multipart/form-data') !== -1) {
    return 'form'
  }

  return 'text'
}

const handleError = (error: Error): Promise<never> => {
  throw error
}

const parseResponse = async (response: Response): Promise<any> => {
  const responseError = !(response.status >= 200 && response.status < 300) || !response.ok
  const contentType = response.headers.get('content-type')
  const normalizedContentType = normalizeContentType(contentType)

  let parsedResponse: any

  switch (normalizedContentType) {
    case 'json':
      parsedResponse = await response.json()
      if (responseError) throw new Error(JSON.stringify(parsedResponse))
      else return parsedResponse
    case 'form':
      parsedResponse = await response.formData()
      if (responseError) throw new Error(parsedResponse)
      else return parsedResponse as FormData
    case 'text':
      parsedResponse = await response.text()
      if (responseError) throw new Error(parsedResponse)
      else return parsedResponse
    default:
      parsedResponse = response.statusText
      if (responseError) throw new Error(parsedResponse)
      else return parsedResponse
  }
}

export default function enhanceFetch(fetch: Window['fetch']): EnhancedFetch {
  return {
    get: async (url, options = {}): Promise<any> =>
      fetch(
        url,
        deepmerge(
          {
            method: 'GET',
            ...baseConfig
          },
          options
        )
      )
        .then(parseResponse)
        .catch(handleError),

    post: async (url, body, options = {}): Promise<any> =>
      fetch(
        url,
        deepmerge(
          {
            method: 'POST',
            ...baseConfig,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          },
          options
        )
      )
        .then(parseResponse)
        .catch(handleError)
  }
}
