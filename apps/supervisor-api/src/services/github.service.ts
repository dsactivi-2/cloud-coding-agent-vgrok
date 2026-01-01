/**
 * GitHub Service - Repository and PR Management
 */

import { GitHubPRInput } from '../types/index.js';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Get GitHub headers with authentication
 */
function getHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;

  return {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VGrok-Agent',
    ...(token && token !== '' ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Create a Pull Request
 */
export async function createPullRequest(input: GitHubPRInput): Promise<{ url: string; number: number }> {
  const { owner, repo, title, body, head, base } = input;

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body, head, base })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    url: data.html_url,
    number: data.number
  };
}

/**
 * Get repository contents
 */
export async function getRepoContents(
  owner: string,
  repo: string,
  path: string = ''
): Promise<Array<{ name: string; path: string; type: string }>> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data.map((item: { name: string; path: string; type: string }) => ({
      name: item.name,
      path: item.path,
      type: item.type
    }));
  }

  return [{ name: data.name, path: data.path, type: data.type }];
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  return '';
}

/**
 * Create or update a file in repository
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  sha?: string
): Promise<{ commit: string }> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return { commit: data.commit.sha };
}

/**
 * Create a new branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string = 'main'
): Promise<{ ref: string }> {
  // Get the SHA of the source branch
  const refResponse = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
    { headers: getHeaders() }
  );

  if (!refResponse.ok) {
    throw new Error(`Could not get ref for ${fromBranch}`);
  }

  const refData = await refResponse.json();
  const sha = refData.object.sha;

  // Create new branch
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return { ref: data.ref };
}
